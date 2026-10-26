/* ============================================================
   CSHOP · 本地脚本回复（仅 AI_MOCK=1 时启用）
   ------------------------------------------------------------
   用来在没有 DeepSeek Key 的情况下验证：
   流式输出、工具调用、多方案、确认卡、购物车/订单闭环。
   它不理解任意自然语言，只覆盖固定验收脚本，不要用于生产。
   ============================================================ */

"use strict";

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function sse(res, payload) {
  if (res.writableEnded) return false;
  res.write("data: " + JSON.stringify(payload) + "\n\n");
  return true;
}

function delta(content) {
  return {
    choices: [{ delta: { content: content }, finish_reason: null }],
  };
}

function toolDelta(calls) {
  return {
    choices: [
      {
        delta: {
          tool_calls: calls.map(function (call, index) {
            return {
              index: index,
              id: call.id,
              type: "function",
              function: {
                name: call.name,
                arguments: JSON.stringify(call.args || {}),
              },
            };
          }),
        },
        finish_reason: null,
      },
    ],
  };
}

function finish(reason) {
  return {
    choices: [{ delta: {}, finish_reason: reason || "stop" }],
  };
}

let seq = 0;

function call(name, args) {
  seq += 1;
  return {
    id: "call_mock_" + Date.now().toString(36) + "_" + seq,
    name: name,
    args: args,
  };
}

async function streamText(res, text) {
  sse(res, delta(""));
  var step = 5;

  for (var i = 0; i < text.length; i += step) {
    if (res.writableEnded) return;
    sse(res, delta(text.slice(i, i + step)));
    await sleep(12);
  }

  sse(res, finish("stop"));
  sseRawDone(res);
}

function sseRawDone(res) {
  if (res.writableEnded) return;
  res.write("data: [DONE]\n\n");
  res.end();
}

async function streamTools(res, calls) {
  sse(res, delta(""));
  await sleep(260);
  if (res.writableEnded) return;
  sse(res, toolDelta(calls));
  sse(res, finish("tool_calls"));
  sseRawDone(res);
}

function normalize(text) {
  return String(text || "").replace(/\s+/g, "");
}

function lastUser(messages) {
  for (var i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") return String(messages[i].content || "");
  }
  return "";
}

function lastToolNames(messages) {
  for (var i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "assistant" && Array.isArray(messages[i].tool_calls)) {
      return messages[i].tool_calls.map(function (item) {
        return item.function && item.function.name;
      });
    }
  }
  return [];
}

function trailingToolResults(messages) {
  var results = [];
  for (var i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role !== "tool") break;
    try {
      results.unshift(JSON.parse(messages[i].content || "{}"));
    } catch (err) {
      results.unshift({ ok: false, error: { message: "工具结果解析失败" } });
    }
  }
  return results;
}

function itemLines(data) {
  var items = (data && data.items) || [];
  return items
    .slice(0, 4)
    .map(function (item) {
      return item.name + "（¥" + item.price.toLocaleString("en-US") + "）";
    })
    .join("、");
}

function money(n) {
  return "¥" + Number(n || 0).toLocaleString("en-US");
}

function productFor(text) {
  if (/Lion\s*8/i.test(text) || /Lion8/i.test(text)) return { id: "cpad-mini-8", qty: 1 };
  if (/CPad\s*Air/i.test(text)) return { id: "cpad-air-11", qty: 1 };
  if (/CPad\s*SE/i.test(text)) return { id: "cpad-se", qty: 1 };
  if (/CPad\s*Board/i.test(text)) return { id: "cpad-board", qty: 1 };
  if (/CMaxing/i.test(text)) return { id: "cmaxing", qty: 1 };
  if (/CPairs/i.test(text)) return { id: "cpairs", qty: 1 };
  if (/CEars/i.test(text)) return { id: "cears", qty: 1 };
  if (/Ccube/i.test(text)) return { id: "ccube", qty: 1 };
  if (/CWatch/i.test(text)) return { id: "cwatch", qty: 1 };
  if (/CPhone\s*21\s*Pro\s*Max/i.test(text)) return { id: "cphone-21-pro-max", qty: 1 };
  if (/CPhone\s*21/i.test(text)) return { id: "cphone-21", qty: 1 };
  return null;
}

function bundleCalls() {
  return [
    call("buildBundle", {
      name: "音质优先",
      tag: "推荐",
      budget: 3000,
      items: [
        { id: "cmaxing", qty: 1 },
        { id: "cpower-usb-head", qty: 1 },
        { id: "cpower-usb-cable", qty: 1 },
        { id: "ccube", qty: 1 },
      ],
    }),
    call("buildBundle", {
      name: "均衡之选",
      tag: "均衡",
      budget: 3000,
      items: [
        { id: "cpairs", qty: 1 },
        { id: "cpower-usb-head", qty: 1 },
        { id: "cpower-usb-cable", qty: 1 },
        { id: "ccube", qty: 1 },
      ],
    }),
    call("buildBundle", {
      name: "轻装出行",
      tag: "更省",
      budget: 3000,
      items: [
        { id: "cears", qty: 1 },
        { id: "cpower-usb-head", qty: 1 },
        { id: "cpower-usb-cable", qty: 1 },
      ],
    }),
  ];
}

async function handleChat(req, res, body) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  if (res.flushHeaders) res.flushHeaders();

  var messages = body.messages || [];
  var last = messages[messages.length - 1] || {};
  var user = normalize(lastUser(messages));
  var names = lastToolNames(messages);
  var results = trailingToolResults(messages);

  try {
    if (last.role === "tool") {
      await handleToolResult(res, user, names, results);
      return;
    }

    await handleUser(res, user, messages);
  } catch (err) {
    if (!res.writableEnded) {
      sse(res, delta("演示服务遇到一点问题，请重试。"));
      sse(res, finish("stop"));
      sseRawDone(res);
    }
  }
}

async function handleToolResult(res, user, names, results) {
  var failed = null;
  results.forEach(function (result) {
    if (result && result.ok === false) failed = result;
  });

  if (failed) {
    var message =
      (failed.error && failed.error.message) ||
      "这一步没有执行成功，请换个方式再试。";
    await streamText(res, message);
    return;
  }

  if (names.indexOf("buildBundle") !== -1) {
    var plans = results
      .map(function (result) {
        return result && result.data;
      })
      .filter(Boolean);

    var lines = plans.map(function (plan) {
      return plan.name + " " + money(plan.total) + "，余 " + money(plan.remaining);
    });

    await streamText(
      res,
      "按 3000 元预算，我配了 " +
        plans.length +
        " 套方案：" +
        lines.join("；") +
        "。推荐第一套「音质优先」，降噪耳机和充电配件都齐了，还留出一点余额。"
    );
    return;
  }

  if (names.indexOf("searchProducts") !== -1) {
    var data = (results[0] && results[0].data) || {};
    var items = data.items || [];

    if (/3000/.test(user) && /(耳机|配件|充电|组合|配齐)/.test(user)) {
      await streamTools(res, bundleCalls());
      return;
    }

    if (!items.length) {
      await streamText(
        res,
        "这个条件下暂时没有符合的商品。要不要把预算放宽一点，或者换成相近的品类看看？"
      );
      return;
    }

    var best = items[0];
    var text =
      "我按条件筛出 " +
      items.length +
      " 件：" +
      itemLines(data) +
      "。";

    if (/1500/.test(user) && /耳机/.test(user)) {
      text +=
        "其中 CPairs 是入耳式主动降噪，CEars 是耳夹式开放佩戴，通勤更推荐 CPairs。";
    } else if (/5000/.test(user) && /平板/.test(user)) {
      text +=
        "综合轻办公和预算，最推荐 " +
        best.name +
        "（" +
        money(best.price) +
        "）；想更省可以看 CPad Lion 8 和 CPad SE。";
    } else {
      text += "最符合的是 " + best.name + "（" + money(best.price) + "）。";
    }

    await streamText(res, text);
    return;
  }

  if (names.indexOf("getCart") !== -1) {
    var cart = (results[0] && results[0].data) || {};
    if (!cart.count) {
      await streamText(res, "购物车现在是空的。要不要我按预算给你配一套？");
      return;
    }
    var namesText = (cart.rows || [])
      .map(function (row) {
        return row.name + " × " + row.qty;
      })
      .join("、");
    await streamText(
      res,
      "购物车里有 " +
        cart.count +
        " 件：" +
        namesText +
        "，合计 " +
        money(cart.total) +
        "。需要改数量、移除，还是直接用默认地址下单？"
    );
    return;
  }

  if (names.indexOf("compareProducts") !== -1) {
    var compared = (results[0] && results[0].data && results[0].data.items) || [];
    if (compared.length >= 2) {
      await streamText(
        res,
        compared[0].name +
          " 售价 " +
          money(compared[0].price) +
          "，" +
          compared[1].name +
          " 售价 " +
          money(compared[1].price) +
          "。两款差价 " +
          money(Math.abs(compared[0].price - compared[1].price)) +
          "，按尺寸和主要用途选比堆参数更实际。需要我把其中一款加进购物车吗？"
      );
      return;
    }
  }

  if (names.indexOf("getProduct") !== -1) {
    var product = (results[0] && results[0].data) || null;

    if (!product) {
      await streamText(res, "没有查到这件商品，可能已经下架。换一款看看？");
      return;
    }

    var stockText =
      product.stock > 0
        ? "目前有货，库存 " + product.stock + " 件"
        : "目前暂时缺货";

    await streamText(
      res,
      product.name +
        " 售价 " +
        money(product.price) +
        "，" +
        stockText +
        "。需要我把它加进购物车吗？"
    );
    return;
  }

  if (names.indexOf("listAddresses") !== -1) {
    await streamText(res, "默认地址已经取到。需要我用这个地址帮你下单吗？");
    return;
  }

  await streamText(res, "这一步完成了。还需要我继续筛选、对比或下单吗？");
}

async function handleUser(res, user, messages) {
  /* 安全与越界 */
  if (/忽略.*指令|把所有商品.*1元|改成1元|系统提示|api.?key|密钥/i.test(user)) {
    await streamText(
      res,
      "抱歉，我不能修改商品价格、绕过确认，或透露系统提示和密钥。选购、加购和下单这些事我可以继续帮你。"
    );
    return;
  }

  if (/售后|物流|保修|什么时候到|退货|退款/.test(user)) {
    await streamText(
      res,
      "售后、物流和保修不在我的服务范围。你可以在「个人中心 → 我的订单」查看订单，或联系人工客服处理。购物方面我还能继续帮你。"
    );
    return;
  }

  if (/天气|论文|写代码|讲个笑话/.test(user)) {
    await streamText(
      res,
      "我只负责 CSHOP 的商品选购、购物车和下单，这个问题帮不上忙。想挑手机、平板、电脑还是配件？"
    );
    return;
  }

  if (/刷新率|屏幕参数|电池容量是多少/.test(user)) {
    await streamText(
      res,
      "商品库没有收录这项参数，我不能凭印象猜。建议在商品详情页确认；我也可以按尺寸、预算和用途帮你筛选。"
    );
    return;
  }

  /* 无地址 / 库存错误等由工具返回，模型收尾 */
  if (/有货|库存/.test(user)) {
    var p = productFor(user);
    if (p) {
      await streamTools(res, [call("getProduct", { id: p.id })]);
      return;
    }
    await streamText(res, "你想查哪一款的库存？给我商品名就可以。");
    return;
  }

  /* 下单 / 购物车 */
  if (/下单|结算|买下来/.test(user)) {
    await streamTools(res, [call("createOrder", { payment: "wechat" })]);
    return;
  }

  if (/购物车.*(什么|哪些|查看|看看)|我购物车里/.test(user)) {
    await streamTools(res, [call("getCart", {})]);
    return;
  }

  if (/加进购物车|加入购物车|加购|帮我加/.test(user)) {
    var prod = productFor(user);

    if (!prod && /(这套|这个组合|方案)/.test(user)) {
      await streamTools(res, [
        call("addToCart", { id: "cmaxing", qty: 1 }),
        call("addToCart", { id: "cpower-usb-head", qty: 1 }),
        call("addToCart", { id: "cpower-usb-cable", qty: 1 }),
        call("addToCart", { id: "ccube", qty: 1 }),
      ]);
      return;
    }

    prod = prod || { id: "cpad-air-11", qty: 1 };
    await streamTools(res, [call("addToCart", prod)]);
    return;
  }

  if (/改成\s*(\d+)\s*件|数量改成|再加一件/.test(user)) {
    var match = user.match(/改成\s*(\d+)\s*件/);
    var qty = match ? Number(match[1]) : 2;
    await streamTools(res, [call("updateCartItem", { id: "cpad-air-11", qty: qty })]);
    return;
  }

  if (/去掉|移除|删掉/.test(user)) {
    var target = productFor(user) || { id: "cpad-air-11" };
    await streamTools(res, [call("removeFromCart", { id: target.id })]);
    return;
  }

  if (/地址/.test(user)) {
    await streamTools(res, [call("listAddresses", {})]);
    return;
  }

  /* 商品检索 */
  if (/3000/.test(user) && /(耳机|配件|充电|组合|配齐|剩下)/.test(user)) {
    await streamTools(res, [call("searchProducts", { category: "accessories", maxPrice: 3000 })]);
    return;
  }

  if (/1500/.test(user) && /耳机/.test(user)) {
    await streamTools(res, [call("searchProducts", { category: "accessories", maxPrice: 1500 })]);
    return;
  }

  if (/便宜/.test(user)) {
    await streamTools(res, [call("searchProducts", { category: "cpad", maxPrice: 3500 })]);
    return;
  }

  if (/5000/.test(user) && /平板/.test(user)) {
    await streamTools(res, [call("searchProducts", { category: "cpad", maxPrice: 5000 })]);
    return;
  }

  if (/平板/.test(user) && !/\d/.test(user)) {
    await streamText(
      res,
      "想先确认两件事：预算大概多少？主要用来做什么（轻办公、随身创作、影音）？"
    );
    return;
  }

  if (/对比|怎么选|差别/.test(user)) {
    var compareIds = [];
    if (/CPad\s*Air/i.test(user)) compareIds.push("cpad-air-11");
    if (/Lion\s*8/i.test(user)) compareIds.push("cpad-mini-8");
    if (/CPad\s*SE/i.test(user)) compareIds.push("cpad-se");
    if (/CPhone\s*21\s*Pro\s*Max/i.test(user)) compareIds.push("cphone-21-pro-max");
    if (/CPhone\s*21/i.test(user)) compareIds.push("cphone-21");

    if (compareIds.length < 2) compareIds = ["cpad-air-11", "cpad-mini-8"];

    await streamTools(res, [
      call("compareProducts", { ids: compareIds.slice(0, 3) }),
    ]);
    return;
  }

  if (/你好|在吗|hi/i.test(user)) {
    await streamText(
      res,
      "你好，我是 CSHOP 礼宾。可以帮你按预算挑商品、对比型号、组合配件，也能直接管理购物车和下单。"
    );
    return;
  }

  await streamText(
    res,
    "我可以帮你按预算和用途挑商品、对比型号、配组合，也能加购和下单。告诉我预算和想要的东西就可以。"
  );
}

module.exports = { handleChat };
