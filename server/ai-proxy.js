/* ============================================================
   CSHOP · DeepSeek 本地代理
   ------------------------------------------------------------
   只做三件事：
   1. 把浏览器发来的对话转发给 DeepSeek（SSE 流式返回）
   2. 把 API Key 留在服务端，永不下发到前端
   3. 提供健康检查，方便前端提示「未配置 / 已连接 / 演示模式」

   启动：node server/ai-proxy.js
   Key ：项目根目录 .env 的 DEEPSEEK_API_KEY
   ============================================================ */

"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

function loadEnv(file) {
  let raw = "";
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (err) {
    return;
  }

  raw.split(/\r?\n/).forEach(function (line) {
    var text = line.trim();
    if (!text || text.charAt(0) === "#") return;
    if (text.indexOf("export ") === 0) text = text.slice(7).trim();

    var eq = text.indexOf("=");
    if (eq < 1) return;

    var key = text.slice(0, eq).trim();
    var value = text.slice(eq + 1).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) return;

    if (
      (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') ||
      (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'")
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  });
}

loadEnv(path.join(__dirname, "..", ".env"));

const PORT = Number(process.env.AI_PORT || 8126);
const HOST = process.env.AI_HOST || "127.0.0.1";
const API_KEY = String(process.env.DEEPSEEK_API_KEY || "").trim();
const BASE_URL = String(process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
const MODEL = String(process.env.DEEPSEEK_MODEL || "deepseek-chat").trim();
const MOCK = /^(1|true|yes|on)$/i.test(String(process.env.AI_MOCK || ""));

const ALLOWED_ORIGINS = String(
  process.env.AI_ALLOWED_ORIGINS ||
    "http://127.0.0.1:8125,http://localhost:8125,https://cshop-store-60211.app.workbuddy.host"
)
  .split(",")
  .map(function (item) {
    return item.trim();
  })
  .filter(Boolean);

const MAX_BODY = 1024 * 1024;
const MAX_MESSAGES = 80;
const MAX_TOTAL_CHARS = 260000;
const UPSTREAM_TIMEOUT = 90000;
const CHAT_RATE_LIMIT = Math.max(0, Number(process.env.AI_RATE_LIMIT || 60));
const CHAT_RATE_WINDOW = Math.max(
  1000,
  Number(process.env.AI_RATE_WINDOW_MS || 5 * 60 * 1000)
);
const chatRateBuckets = new Map();

const mock = MOCK ? require("./mock-ai") : null;

/* ---------------- HTTP 工具 ---------------- */

function cors(req, res) {
  var origin = req.headers.origin;

  if (!origin) return true;

  if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
    res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        error: {
          code: "ORIGIN_DENIED",
          message: "该来源未被允许访问本地 AI 代理。",
        },
      })
    );
    return false;
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "600");
  return true;
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    var size = 0;

    req.on("data", function (chunk) {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("BODY_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", function () {
      try {
        var raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(new Error("INVALID_JSON"));
      }
    });

    req.on("error", reject);
  });
}

function cleanMessages(input) {
  if (!Array.isArray(input) || !input.length) return null;
  if (input.length > MAX_MESSAGES) return null;

  var total = 0;
  var out = [];

  for (var i = 0; i < input.length; i += 1) {
    var item = input[i];
    if (!item || typeof item !== "object") return null;

    var role = item.role;
    if (["system", "user", "assistant", "tool"].indexOf(role) === -1) return null;

    var content = item.content;
    if (content == null) content = "";
    if (typeof content !== "string") return null;
    if (content.length > 60000) return null;

    total += content.length;
    if (total > MAX_TOTAL_CHARS) return null;

    var message = { role: role, content: content };

    if (role === "tool") {
      if (typeof item.tool_call_id !== "string" || !item.tool_call_id) return null;
      message.tool_call_id = item.tool_call_id;
      if (typeof item.name === "string") message.name = item.name;
    }

    if (role === "assistant" && Array.isArray(item.tool_calls) && item.tool_calls.length) {
      var calls = [];
      for (var j = 0; j < item.tool_calls.length; j += 1) {
        var call = item.tool_calls[j];
        if (!call || !call.function || typeof call.function.name !== "string") return null;
        calls.push({
          id: String(call.id || "call_" + j),
          type: "function",
          function: {
            name: call.function.name,
            arguments: String(call.function.arguments || "{}"),
          },
        });
      }
      message.tool_calls = calls;
    }

    out.push(message);
  }

  return out;
}

function cleanTools(input) {
  if (input == null) return undefined;
  if (!Array.isArray(input)) return undefined;

  var out = [];
  input.slice(0, 20).forEach(function (tool) {
    if (!tool || tool.type !== "function" || !tool.function) return;
    if (typeof tool.function.name !== "string") return;
    out.push({
      type: "function",
      function: {
        name: tool.function.name,
        description: String(tool.function.description || ""),
        parameters: tool.function.parameters || { type: "object", properties: {} },
      },
    });
  });

  return out.length ? out : undefined;
}

function buildUpstreamBody(body) {
  var payload = {
    model: MODEL,
    messages: cleanMessages(body.messages),
    stream: true,
    stream_options: { include_usage: true },
    temperature: Math.max(0, Math.min(1.5, Number(body.temperature) || 0.4)),
    max_tokens: Math.max(200, Math.min(2000, Number(body.max_tokens) || 1100)),
  };

  var tools = cleanTools(body.tools);
  if (tools) payload.tools = tools;

  return payload;
}

/* ---------------- 上游调用 ---------------- */

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

async function openUpstream(payload, signal) {
  var url = BASE_URL + "/chat/completions";
  var headers = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    Authorization: "Bearer " + API_KEY,
  };

  for (var attempt = 0; attempt < 2; attempt += 1) {
    var response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
      signal: signal,
    });

    if (response.ok) return response;

    var retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 1) {
      var detail = "";
      try {
        detail = await response.text();
      } catch (err) {
        detail = "";
      }
      var error = new Error("UPSTREAM_" + response.status);
      error.status = response.status;
      error.detail = detail.slice(0, 500);
      throw error;
    }

    await wait(900);
  }

  throw new Error("UPSTREAM_RETRY_EXHAUSTED");
}

function upstreamErrorPayload(err) {
  var status = err && err.status;
  var code = "UPSTREAM";
  var message = "模型服务暂时不可用，请稍后重试。";

  if (status === 401 || status === 403) {
    code = "AUTH";
    message = "DeepSeek Key 无效或没有权限，请检查 .env 后重启代理。";
  } else if (status === 429) {
    code = "RATE_LIMIT";
    message = "模型请求过于频繁，请稍候再试。";
  } else if (err && err.name === "AbortError") {
    code = "TIMEOUT";
    message = "模型响应超时，请重试。";
  }

  return { error: { code: code, message: message } };
}

/* ---------------- 路由 ---------------- */

function clientIp(req) {
  var forwarded =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"] ||
    (req.socket && req.socket.remoteAddress) ||
    "";
  if (Array.isArray(forwarded)) forwarded = forwarded[0];
  return String(forwarded).split(",")[0].trim() || "unknown";
}

function chatRateLimited(req, res) {
  if (!CHAT_RATE_LIMIT) return false;

  var now = Date.now();
  var ip = clientIp(req);
  var bucket = chatRateBuckets.get(ip);

  if (!bucket || now >= bucket.reset) {
    bucket = { count: 0, reset: now + CHAT_RATE_WINDOW };
    chatRateBuckets.set(ip, bucket);
  }

  bucket.count += 1;

  res.setHeader("X-RateLimit-Limit", String(CHAT_RATE_LIMIT));
  res.setHeader(
    "X-RateLimit-Remaining",
    String(Math.max(0, CHAT_RATE_LIMIT - bucket.count))
  );
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.reset / 1000)));

  if (bucket.count > CHAT_RATE_LIMIT) {
    res.setHeader(
      "Retry-After",
      String(Math.max(1, Math.ceil((bucket.reset - now) / 1000)))
    );
    sendJson(res, 429, {
      error: {
        code: "RATE_LIMITED",
        message: "请求过于频繁，请稍后再试。",
      },
    });
    return true;
  }

  if (chatRateBuckets.size > 5000) {
    chatRateBuckets.forEach(function (value, key) {
      if (value.reset <= now) chatRateBuckets.delete(key);
    });
  }

  return false;
}

async function handleHealth(req, res) {
  sendJson(res, 200, {
    ok: true,
    configured: MOCK ? true : !!API_KEY,
    mock: !!MOCK,
    model: MODEL,
  });
}

async function handleChat(req, res) {
  var body;
  try {
    body = await readJson(req);
  } catch (err) {
    var code = err.message === "BODY_TOO_LARGE" ? "BODY_TOO_LARGE" : "INVALID_JSON";
    var message =
      code === "BODY_TOO_LARGE"
        ? "请求内容过大，请精简对话后重试。"
        : "请求格式不正确。";
    sendJson(res, 400, { error: { code: code, message: message } });
    return;
  }

  var messages = cleanMessages(body.messages);
  if (!messages) {
    sendJson(res, 400, {
      error: { code: "INVALID_MESSAGES", message: "对话内容格式不正确。" },
    });
    return;
  }

  if (MOCK) {
    await mock.handleChat(req, res, {
      messages: messages,
      model: MODEL,
    });
    return;
  }

  if (!API_KEY || API_KEY === "sk-your-key-here") {
    sendJson(res, 503, {
      error: {
        code: "NO_KEY",
        message:
          "AI 服务尚未配置 DeepSeek Key。请把 .env.example 复制为 .env，填写 DEEPSEEK_API_KEY 后重启代理。",
      },
    });
    return;
  }

  var payload;
  try {
    payload = buildUpstreamBody(body);
  } catch (err) {
    sendJson(res, 400, {
      error: { code: "INVALID_PAYLOAD", message: "对话参数不正确。" },
    });
    return;
  }

  var controller = new AbortController();
  var timer = setTimeout(function () {
    controller.abort();
  }, UPSTREAM_TIMEOUT);

  res.on("close", function () {
    controller.abort();
    clearTimeout(timer);
  });

  var upstream;
  try {
    upstream = await openUpstream(payload, controller.signal);
  } catch (err) {
    clearTimeout(timer);
    if (res.writableEnded) return;
    var status = err && err.name === "AbortError" ? 504 : 502;
    sendJson(res, status, upstreamErrorPayload(err));
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  if (res.flushHeaders) res.flushHeaders();

  try {
    var reader = upstream.body.getReader();
    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      res.write(Buffer.from(chunk.value));
    }
    res.end();
  } catch (err) {
    if (!res.writableEnded) {
      res.write(
        "data: " +
          JSON.stringify({
            error: {
              code: "STREAM_INTERRUPTED",
              message: "连接中断，请重试。",
            },
          }) +
          "\n\n"
      );
      res.end();
    }
  } finally {
    clearTimeout(timer);
  }
}

var server = http.createServer(async function (req, res) {
  if (!cors(req, res)) return;

  var url = new URL(req.url, "http://" + (req.headers.host || "localhost"));

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    await handleHealth(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/chat") {
    if (chatRateLimited(req, res)) return;
    await handleChat(req, res);
    return;
  }

  sendJson(res, 404, {
    error: { code: "NOT_FOUND", message: "接口不存在。" },
  });
});

server.listen(PORT, HOST, function () {
  var mode = MOCK ? "MOCK 演示模式" : API_KEY ? "DeepSeek " + MODEL : "未配置 Key";
  console.log("CSHOP AI proxy  http://" + HOST + ":" + PORT + "  ·  " + mode);
  if (!MOCK && !API_KEY) {
    console.log("提示：复制 .env.example 为 .env 并填写 DEEPSEEK_API_KEY 后重启。");
  }
});
