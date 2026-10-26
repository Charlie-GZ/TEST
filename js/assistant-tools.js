/* ============================================================
   CSHOP · AI 购物助手工具层
   ------------------------------------------------------------
   工具只读写本项目已有的 localStorage 数据：
   商品库 / 购物车 / 账号地址 / 订单。
   所有写工具必须由 UI 确认后带 { confirmed: true } 调用。
   ============================================================ */

window.CShopAssistantTools = (function () {
  "use strict";

  var products = window.CShopProducts;
  var cart = window.CShopCart;
  var auth = window.CShopAuth;
  var orders = window.CShopOrders;
  var MAX_QTY = 99;

  var CATEGORY_LABEL = {
    cphone: "手机",
    cpad: "平板",
    cbook: "电脑",
    accessories: "配件",
  };

  var CATEGORY_ALIAS = {
    cphone: "cphone",
    手机: "cphone",
    phone: "cphone",
    cpad: "cpad",
    平板: "cpad",
    tablet: "cpad",
    pad: "cpad",
    cbook: "cbook",
    电脑: "cbook",
    笔记本: "cbook",
    laptop: "cbook",
    book: "cbook",
    accessories: "accessories",
    配件: "accessories",
    耳机: "accessories",
    充电: "accessories",
    accessory: "accessories",
  };

  var WRITE_TOOLS = {
    addToCart: true,
    updateCartItem: true,
    removeFromCart: true,
    createOrder: true,
  };

  var PAY_LABEL = {
    wechat: "微信支付（模拟）",
  };

  /* ---------------- 通用 ---------------- */

  function money(value) {
    return "¥" + Number(value || 0).toLocaleString("en-US");
  }

  function session() {
    return auth && auth.getSession ? auth.getSession() : null;
  }

  function accountId() {
    var s = session();
    return s && s.account ? s.account : "";
  }

  function productById(id) {
    if (!products || !id) return null;
    var list = products.all.filter(function (item) {
      return item.id === id;
    });
    return list[0] || null;
  }

  function publicProduct(product) {
    if (!product) return null;
    return {
      id: product.id,
      name: product.name,
      desc: product.desc,
      price: product.price,
      category: product.category,
      categoryLabel: CATEGORY_LABEL[product.category] || product.category,
      stock: product.stock,
      tags: product.tags || [],
      isNew: !!product.isNew,
      image: product.image || "",
    };
  }

  function maskPhone(phone) {
    var text = String(phone || "");
    if (text.length >= 7) return text.slice(0, 3) + "****" + text.slice(-4);
    return text;
  }

  function regionOf(address) {
    return [address.province, address.city, address.district]
      .filter(Boolean)
      .join("");
  }

  function addressPublic(address) {
    if (!address) return null;
    return {
      id: address.id,
      name: address.name,
      phone: maskPhone(address.phone),
      region: regionOf(address),
      detail: address.detail,
      tag: address.tag || "",
      isDefault: !!address.isDefault,
      text:
        address.name +
        " " +
        maskPhone(address.phone) +
        " · " +
        regionOf(address) +
        " " +
        address.detail,
    };
  }

  function fail(code, message, extra) {
    var error = { code: code, message: message };
    if (extra) {
      Object.keys(extra).forEach(function (key) {
        error[key] = extra[key];
      });
    }
    return { ok: false, error: error };
  }

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    var num = Number(value);
    return isFinite(num) ? num : NaN;
  }

  function normalizeCategory(value) {
    if (value === null || value === undefined || value === "") return null;
    var key = String(value).trim().toLowerCase();
    return CATEGORY_ALIAS[key] || CATEGORY_ALIAS[String(value).trim()] || null;
  }

  function categoryFromText(text) {
    var value = String(text || "");
    if (/平板|cpad|tablet/i.test(value)) return "cpad";
    if (/手机|cphone|phone/i.test(value)) return "cphone";
    if (/笔记本|电脑|cbook|laptop/i.test(value)) return "cbook";
    if (/耳机|配件|充电|手表|充电宝|accessor/i.test(value)) return "accessories";
    return null;
  }

  function queryScore(product, query) {
    if (!query) return 0;
    var q = String(query).trim().toLowerCase();
    if (!q) return 0;

    var name = String(product.name || "").toLowerCase();
    var hay = [
      product.name,
      product.desc,
      (product.tags || []).join(" "),
      (product.keywords || []).join(" "),
    ]
      .join(" ")
      .toLowerCase();

    var terms = q.split(/\s+/).filter(Boolean);
    var score = 0;

    terms.forEach(function (term) {
      if (name === term) score += 100;
      else if (name.indexOf(term) === 0) score += 60;
      else if (name.indexOf(term) !== -1) score += 40;
      else if (hay.indexOf(term) !== -1) score += 12;
      else score -= 30;
    });

    return score;
  }

  function cartRows() {
    if (!cart) return [];
    return cart.items() || [];
  }

  function cartCount() {
    return cart ? cart.count() : 0;
  }

  function cartTotal() {
    return cart ? cart.total() : 0;
  }

  function defaultAddress() {
    var list = auth && auth.listAddresses && accountId() ? auth.listAddresses(accountId()) : [];
    var def = null;
    list.forEach(function (item) {
      if (item.isDefault) def = item;
    });
    return def || list[0] || null;
  }

  /* ---------------- 工具定义 ---------------- */

  var definitions = [
    {
      type: "function",
      function: {
        name: "searchProducts",
        description:
          "检索 CSHOP 商品库，按品类、预算、关键词筛选并排序。推荐、比较、规划前必须先调用。价格单位元。",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "商品名或关键词，例如 平板、降噪、CPad" },
            category: {
              type: "string",
              enum: ["cphone", "cpad", "cbook", "accessories"],
              description: "品类：手机 / 平板 / 电脑 / 配件",
            },
            minPrice: { type: "number", minimum: 0, description: "最低价（元）" },
            maxPrice: { type: "number", minimum: 0, description: "最高价（元）" },
            sort: {
              type: "string",
              enum: ["smart", "price-asc", "price-desc", "newest"],
              description: "排序；默认 smart",
            },
            limit: { type: "number", minimum: 1, maximum: 12, description: "最多返回几件，默认 8" },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "getProduct",
        description: "按商品 id 获取完整信息。",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "商品 id，例如 cpad-air-11" },
          },
          required: ["id"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "compareProducts",
        description: "并排比较 2–3 件商品的价格、定位、库存与标签。",
        parameters: {
          type: "object",
          properties: {
            ids: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              maxItems: 3,
              description: "要比较的商品 id",
            },
          },
          required: ["ids"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "buildBundle",
        description:
          "校验并计算一套商品组合：逐项价格、总价、库存、预算余额。只读，不改购物车。做多步规划时用它生成 2–3 套方案，再向用户推荐。",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "方案名，例如 音质优先" },
            tag: { type: "string", description: "短标签，例如 推荐 / 更省 / 均衡" },
            budget: { type: "number", minimum: 0, description: "本方案对照的预算（元）" },
            items: {
              type: "array",
              minItems: 1,
              maxItems: 8,
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  qty: { type: "number", minimum: 1, maximum: 99 },
                },
                required: ["id"],
              },
            },
          },
          required: ["name", "items"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "getCart",
        description: "读取当前购物车：每件商品、数量、小计、合计。",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "addToCart",
        description:
          "把商品加入购物车。这是写操作，前端会显示确认卡，用户确认后才执行。不要在回复里提前声称已加入。",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "商品 id" },
            qty: { type: "number", minimum: 1, maximum: 99, description: "数量，默认 1" },
          },
          required: ["id"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "updateCartItem",
        description: "修改购物车中某件商品的数量。写操作，需要用户确认。",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "商品 id" },
            qty: { type: "number", minimum: 1, maximum: 99, description: "修改后的数量" },
          },
          required: ["id", "qty"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "removeFromCart",
        description: "从购物车移除某件商品。写操作，需要用户确认。",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "商品 id" },
          },
          required: ["id"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "listAddresses",
        description:
          "读取当前账号的收货地址，手机号已脱敏。下单前可用；没有默认地址时引导去个人中心添加。",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "createOrder",
        description:
          "用当前购物车生成订单，默认使用默认地址和模拟微信支付。写操作，必须经用户确认；金额由系统计算，不能由你指定。",
        parameters: {
          type: "object",
          properties: {
            addressId: { type: "string", description: "收货地址 id，省略则使用默认地址" },
            payment: {
              type: "string",
              enum: ["wechat"],
              description: "支付方式，当前仅支持模拟微信支付",
            },
            note: { type: "string", description: "订单备注，最多 100 字" },
          },
        },
      },
    },
  ];

  /* ---------------- 只读工具 ---------------- */

  function searchProducts(args) {
    if (!products) return fail("NO_CATALOG", "商品库还没有加载，请刷新页面后重试。");
    var a = isPlainObject(args) ? args : {};

    var query = a.query == null ? "" : String(a.query).trim();
    if (query.length > 60) return fail("INVALID_QUERY", "搜索关键词太长了，请精简到 60 字以内。");

    var category = normalizeCategory(a.category);
    if (a.category != null && a.category !== "" && !category) {
      return fail("INVALID_CATEGORY", "品类只支持 cphone、cpad、cbook、accessories。");
    }
    if (!category) category = categoryFromText(query);

    var minPrice = toNumber(a.minPrice);
    var maxPrice = toNumber(a.maxPrice);
    if (minPrice !== null && (isNaN(minPrice) || minPrice < 0)) {
      return fail("INVALID_PRICE", "最低价必须是非负数字。");
    }
    if (maxPrice !== null && (isNaN(maxPrice) || maxPrice < 0)) {
      return fail("INVALID_PRICE", "最高价必须是非负数字。");
    }
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      return fail("INVALID_RANGE", "最低价不能高于最高价。");
    }

    var limit = toNumber(a.limit);
    if (limit === null) limit = 8;
    if (isNaN(limit) || limit < 1) limit = 1;
    if (limit > 12) limit = 12;

    var sort = String(a.sort || "smart");
    if (["smart", "price-asc", "price-desc", "newest"].indexOf(sort) === -1) sort = "smart";

    var matched = products.all.filter(function (product) {
      if (category && product.category !== category) return false;
      if (minPrice !== null && product.price < minPrice) return false;
      if (maxPrice !== null && product.price > maxPrice) return false;
      if (query && queryScore(product, query) < 0) return false;
      return true;
    });

    matched.sort(function (a1, b1) {
      if (sort === "price-asc") return a1.price - b1.price;
      if (sort === "price-desc") return b1.price - a1.price;
      if (sort === "newest") {
        if (!!a1.isNew !== !!b1.isNew) return a1.isNew ? -1 : 1;
        return b1.price - a1.price;
      }

      if (query) {
        var diff = queryScore(b1, query) - queryScore(a1, query);
        if (diff) return diff;
      }
      if (!!a1.isNew !== !!b1.isNew) return a1.isNew ? -1 : 1;
      return b1.price - a1.price;
    });

    return {
      ok: true,
      data: {
        items: matched.slice(0, limit).map(publicProduct),
        total: matched.length,
        query: {
          text: query,
          category: category,
          categoryLabel: category ? CATEGORY_LABEL[category] : "全部",
          minPrice: minPrice,
          maxPrice: maxPrice,
          sort: sort,
        },
      },
    };
  }

  function getProduct(args) {
    var a = isPlainObject(args) ? args : {};
    var id = String(a.id == null ? "" : a.id).trim();
    if (!id) return fail("INVALID_ID", "缺少商品 id。");
    var product = productById(id);
    if (!product) return fail("NOT_FOUND", "没有找到这件商品，可能已下架。");
    return { ok: true, data: publicProduct(product) };
  }

  function compareProducts(args) {
    var a = isPlainObject(args) ? args : {};
    var ids = Array.isArray(a.ids) ? a.ids : [];
    if (ids.length < 2 || ids.length > 3) {
      return fail("INVALID_IDS", "请选择 2–3 件商品进行比较。");
    }

    var items = [];
    for (var i = 0; i < ids.length; i += 1) {
      var product = productById(String(ids[i]));
      if (!product) return fail("NOT_FOUND", "要比较的商品中有不存在的项。");
      if (!items.some(function (item) { return item.id === product.id; })) {
        items.push(publicProduct(product));
      }
    }

    if (items.length < 2) return fail("INVALID_IDS", "至少需要 2 件不同商品。");

    return {
      ok: true,
      data: {
        items: items,
        priceMin: Math.min.apply(null, items.map(function (item) { return item.price; })),
        priceMax: Math.max.apply(null, items.map(function (item) { return item.price; })),
      },
    };
  }

  function buildBundle(args) {
    var a = isPlainObject(args) ? args : {};
    var name = String(a.name == null ? "" : a.name).trim();
    if (!name) return fail("INVALID_NAME", "方案需要一个名字。");
    if (name.length > 30) name = name.slice(0, 30);

    var tag = String(a.tag == null ? "" : a.tag).trim().slice(0, 8);
    var budget = toNumber(a.budget);
    if (budget !== null && (isNaN(budget) || budget < 0)) {
      return fail("INVALID_BUDGET", "预算必须是非负数字。");
    }

    var rawItems = Array.isArray(a.items) ? a.items : [];
    if (!rawItems.length) return fail("EMPTY_BUNDLE", "组合里至少要有一件商品。");
    if (rawItems.length > 8) return fail("TOO_MANY_ITEMS", "一个组合最多 8 件商品。");

    var merged = {};
    for (var i = 0; i < rawItems.length; i += 1) {
      var raw = rawItems[i] || {};
      var product = productById(String(raw.id || ""));
      if (!product) return fail("NOT_FOUND", "组合里有商品不存在。");

      var qty = Math.round(Number(raw.qty) || 1);
      if (!isFinite(qty) || qty < 1) return fail("INVALID_QTY", "商品数量至少为 1。");
      if (qty > Math.min(MAX_QTY, product.stock)) {
        return fail("LIMIT", "「" + product.name + "」最多可买 " + Math.min(MAX_QTY, product.stock) + " 件。");
      }

      if (!merged[product.id]) {
        merged[product.id] = { product: product, qty: 0 };
      }
      merged[product.id].qty += qty;
    }

    var rows = Object.keys(merged).map(function (id) {
      var entry = merged[id];
      if (entry.qty > Math.min(MAX_QTY, entry.product.stock)) {
        return null;
      }
      return {
        id: entry.product.id,
        name: entry.product.name,
        price: entry.product.price,
        qty: entry.qty,
        lineTotal: entry.product.price * entry.qty,
        image: entry.product.image || "",
        stock: entry.product.stock,
      };
    });

    if (rows.indexOf(null) !== -1) {
      return fail("LIMIT", "合并后数量超过库存，请减少数量。");
    }

    var total = rows.reduce(function (sum, row) { return sum + row.lineTotal; }, 0);
    var count = rows.reduce(function (sum, row) { return sum + row.qty; }, 0);
    var remaining = budget === null ? null : budget - total;

    return {
      ok: true,
      data: {
        name: name,
        tag: tag,
        rows: rows,
        total: total,
        count: count,
        budget: budget,
        remaining: remaining,
        overBudget: budget !== null && total > budget,
        stockOk: true,
        formula: rows.map(function (row) {
          return row.price.toLocaleString("en-US") + " × " + row.qty;
        }).join(" + ") + " = " + total.toLocaleString("en-US"),
      },
    };
  }

  function getCart() {
    if (!cart) return fail("NO_CART", "购物车还没有加载，请刷新页面后重试。");
    var rows = cartRows().map(function (row) {
      return {
        id: row.id,
        name: row.product.name,
        price: row.price,
        qty: row.qty,
        lineTotal: row.lineTotal,
        image: row.product.image || "",
        limit: row.limit,
      };
    });

    return {
      ok: true,
      data: {
        rows: rows,
        count: cartCount(),
        total: cartTotal(),
      },
    };
  }

  function listAddresses() {
    if (!auth) return fail("NO_AUTH", "账号模块还没有加载，请刷新页面后重试。");
    var account = accountId();
    if (!account) return fail("NO_SESSION", "请先登录后再管理收货地址。");

    var list = auth.listAddresses(account) || [];
    var pub = list.map(addressPublic);

    return {
      ok: true,
      data: {
        items: pub,
        defaultId: (defaultAddress() || {}).id || null,
        hasDefault: !!defaultAddress(),
      },
    };
  }

  /* ---------------- 写操作校验 ---------------- */

  function previewAddToCart(args) {
    var a = isPlainObject(args) ? args : {};
    var product = productById(String(a.id || ""));
    if (!product) return fail("NOT_FOUND", "没有找到这件商品，可能已下架。");
    if (!cart) return fail("NO_CART", "购物车还没有加载。");

    var qty = Math.round(Number(a.qty) || 1);
    if (!isFinite(qty) || qty < 1) return fail("INVALID_QTY", "加入数量至少为 1。");

    var limit = Math.min(MAX_QTY, product.stock);
    if (limit <= 0) return fail("SOLD_OUT", "「" + product.name + "」暂时缺货。");

    var current = 0;
    cartRows().forEach(function (row) {
      if (row.id === product.id) current = row.qty;
    });

    if (current + qty > limit) {
      var canAdd = Math.max(0, limit - current);
      return fail(
        "LIMIT",
        "「" + product.name + "」最多可买 " + limit + " 件，购物车已有 " + current + " 件。",
        { limit: limit, current: current, canAdd: canAdd }
      );
    }

    return {
      ok: true,
      data: {
        kind: "addToCart",
        actionLabel: "加入购物车",
        product: publicProduct(product),
        qty: qty,
        lineTotal: product.price * qty,
        currentQty: current,
        nextQty: current + qty,
        limit: limit,
      },
    };
  }

  function previewUpdateCartItem(args) {
    var a = isPlainObject(args) ? args : {};
    var product = productById(String(a.id || ""));
    if (!product) return fail("NOT_FOUND", "没有找到这件商品。");
    if (!cart) return fail("NO_CART", "购物车还没有加载。");

    var qty = Math.round(Number(a.qty));
    if (!isFinite(qty) || qty < 1) {
      return fail("INVALID_QTY", "数量至少为 1；如果要移除商品，请使用 removeFromCart。");
    }

    var current = null;
    cartRows().forEach(function (row) {
      if (row.id === product.id) current = row;
    });
    if (!current) return fail("NOT_IN_CART", "购物车里没有「" + product.name + "」。");

    var limit = Math.min(MAX_QTY, product.stock);
    if (qty > limit) {
      return fail("LIMIT", "「" + product.name + "」最多可买 " + limit + " 件。", { limit: limit });
    }

    return {
      ok: true,
      data: {
        kind: "updateCartItem",
        actionLabel: "修改数量",
        product: publicProduct(product),
        qty: qty,
        currentQty: current.qty,
        lineTotal: product.price * qty,
        deltaTotal: (qty - current.qty) * product.price,
      },
    };
  }

  function previewRemoveFromCart(args) {
    var a = isPlainObject(args) ? args : {};
    var product = productById(String(a.id || ""));
    if (!product) return fail("NOT_FOUND", "没有找到这件商品。");
    if (!cart) return fail("NO_CART", "购物车还没有加载。");

    var current = null;
    cartRows().forEach(function (row) {
      if (row.id === product.id) current = row;
    });
    if (!current) return fail("NOT_IN_CART", "购物车里没有「" + product.name + "」。");

    return {
      ok: true,
      data: {
        kind: "removeFromCart",
        actionLabel: "从购物车移除",
        product: publicProduct(product),
        qty: current.qty,
        lineTotal: current.lineTotal,
      },
    };
  }

  function previewCreateOrder(args) {
    var a = isPlainObject(args) ? args : {};
    if (!cart) return fail("NO_CART", "购物车还没有加载。");
    if (!orders) return fail("NO_ORDERS", "订单模块还没有加载，请打开结算页或刷新后再试。");
    if (!auth) return fail("NO_AUTH", "账号模块还没有加载。");

    var account = accountId();
    if (!account) return fail("NO_SESSION", "请先登录后再下单。");

    var rows = cartRows();
    if (!rows.length) return fail("EMPTY_CART", "购物车是空的，先挑几件商品再加入吧。");

    var address = null;
    var addressId = String(a.addressId == null ? "" : a.addressId).trim();
    var list = auth.listAddresses(account) || [];

    if (addressId) {
      list.forEach(function (item) {
        if (item.id === addressId) address = item;
      });
      if (!address) return fail("ADDRESS_NOT_FOUND", "没有找到这个收货地址。");
    } else {
      address = defaultAddress();
      if (!address) {
        return fail(
          "NO_ADDRESS",
          "账户还没有收货地址。请先到「个人中心 → 收货地址」添加一个默认地址，再回来下单。",
          { actionLabel: "去添加地址", actionHref: "profile.html#address" }
        );
      }
    }

    var payment = String(a.payment || "wechat");
    if (payment !== "wechat") {
      return fail("INVALID_PAYMENT", "当前仅支持模拟微信支付。");
    }

    var note = String(a.note == null ? "" : a.note).trim();
    if (note.length > 100) return fail("NOTE_TOO_LONG", "订单备注最多 100 字。");

    var items = rows.map(function (row) {
      return {
        id: row.id,
        name: row.product.name,
        price: row.price,
        qty: row.qty,
        image: row.product.image || "",
        color: "",
      };
    });

    var goods = rows.reduce(function (sum, row) { return sum + row.lineTotal; }, 0);

    return {
      ok: true,
      data: {
        kind: "createOrder",
        actionLabel: "提交订单",
        items: items,
        count: rows.reduce(function (sum, row) { return sum + row.qty; }, 0),
        goodsTotal: goods,
        shipping: 0,
        total: goods,
        address: addressPublic(address),
        payment: payment,
        paymentLabel: PAY_LABEL[payment],
        addressId: address.id,
        note: note,
      },
    };
  }

  function previewWrite(name, args) {
    if (name === "addToCart") return previewAddToCart(args);
    if (name === "updateCartItem") return previewUpdateCartItem(args);
    if (name === "removeFromCart") return previewRemoveFromCart(args);
    if (name === "createOrder") return previewCreateOrder(args);
    return fail("NOT_WRITE_TOOL", "这不是写操作。");
  }

  /* ---------------- 执行 ---------------- */

  function executeRead(name, args) {
    if (name === "searchProducts") return searchProducts(args);
    if (name === "getProduct") return getProduct(args);
    if (name === "compareProducts") return compareProducts(args);
    if (name === "buildBundle") return buildBundle(args);
    if (name === "getCart") return getCart();
    if (name === "listAddresses") return listAddresses();
    return fail("UNKNOWN_TOOL", "不支持的工具：" + name);
  }

  function executeWrite(name, args) {
    var preview = previewWrite(name, args);
    if (!preview.ok) return preview;

    if (name === "addToCart") {
      var added = cart.add(preview.data.product.id, preview.data.qty);
      if (!added.ok) {
        return fail("CART_ERROR", "加入购物车失败，请刷新后重试。", { reason: added.reason });
      }
      var snapshot = getCart();
      return {
        ok: true,
        data: {
          action: "addToCart",
          product: preview.data.product,
          qty: preview.data.qty,
          cart: snapshot.ok ? snapshot.data : null,
        },
      };
    }

    if (name === "updateCartItem") {
      var updated = cart.setQty(preview.data.product.id, preview.data.qty);
      if (!updated.ok) {
        return fail("CART_ERROR", "修改数量失败，请刷新后重试。", { reason: updated.reason });
      }
      var snapshot2 = getCart();
      return {
        ok: true,
        data: {
          action: "updateCartItem",
          product: preview.data.product,
          qty: preview.data.qty,
          cart: snapshot2.ok ? snapshot2.data : null,
        },
      };
    }

    if (name === "removeFromCart") {
      var removed = cart.remove(preview.data.product.id);
      if (!removed.ok) {
        return fail("CART_ERROR", "移除失败，请刷新后重试。", { reason: removed.reason });
      }
      var snapshot3 = getCart();
      return {
        ok: true,
        data: {
          action: "removeFromCart",
          product: preview.data.product,
          cart: snapshot3.ok ? snapshot3.data : null,
        },
      };
    }

    if (name === "createOrder") {
      var p = preview.data;
      var address = null;
      (auth.listAddresses(accountId()) || []).forEach(function (item) {
        if (item.id === p.addressId) address = item;
      });
      if (!address) return fail("ADDRESS_NOT_FOUND", "收货地址已被删除，请重新选择地址后再下单。");

      var order = orders.create(accountId(), {
        items: p.items,
        goodsTotal: p.goodsTotal,
        shipping: p.shipping,
        total: p.total,
        address: address,
        payment: p.payment,
        note: p.note,
      });

      cart.clear();

      return {
        ok: true,
        data: {
          action: "createOrder",
          order: {
            id: order.id,
            total: order.total,
            count: p.count,
            items: p.items,
            address: p.address,
            paymentLabel: p.paymentLabel,
            createdAt: order.createdAt,
          },
          cart: { rows: [], count: 0, total: 0 },
        },
      };
    }

    return fail("UNKNOWN_TOOL", "不支持的工具：" + name);
  }

  function execute(name, args, options) {
    var confirmed = !!(options && options.confirmed);

    if (WRITE_TOOLS[name] && !confirmed) {
      return fail("CONFIRM_REQUIRED", "写操作需要用户确认后才能执行。", {
        requiresConfirmation: true,
      });
    }

    if (WRITE_TOOLS[name]) return executeWrite(name, args);
    return executeRead(name, args);
  }

  /* ---------------- 系统提示用的目录快照 ---------------- */

  function catalogSnapshot() {
    if (!products) return "商品库尚未加载。";
    return products.all
      .map(function (product) {
        return (
          product.id +
          " | " +
          product.name +
          " | " +
          money(product.price) +
          " | " +
          (CATEGORY_LABEL[product.category] || product.category) +
          " | 库存 " +
          product.stock +
          " | " +
          product.desc +
          " | " +
          (product.tags || []).join("/")
        );
      })
      .join("\n");
  }

  return {
    definitions: definitions,
    writeNames: WRITE_TOOLS,
    execute: execute,
    previewWrite: previewWrite,
    catalogSnapshot: catalogSnapshot,
    publicProduct: publicProduct,
    productById: productById,
    money: money,
    maskPhone: maskPhone,
    addressPublic: addressPublic,
    defaultAddress: defaultAddress,
    categoryLabel: CATEGORY_LABEL,
    categoryFromText: categoryFromText,
    normalizeCategory: normalizeCategory,
  };
})();
