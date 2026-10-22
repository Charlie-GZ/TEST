/* ============================================================
   CSHOP · 购物车
   ------------------------------------------------------------
   状态：localStorage('cshop_cart') → [{ id, qty }]
   能力：加购 / 移除 / 改数量 / 单项小计 / 合计 / 清空 / 跨标签页同步
   界面：右侧抽屉（点导航购物车图标打开）
   ============================================================ */

window.CShopCart = (function () {
  "use strict";

  var KEY = "cshop_cart";
  var MAX_QTY = 99;

  var shop = window.CShopProducts || null;
  var items = []; /* [{ id, qty }] */
  var listeners = [];

  /* ---------------- 基础工具 ---------------- */

  function productOf(id) {
    if (!shop) return null;
    var list = shop.all.filter(function (item) {
      return item.id === id;
    });
    return list[0] || null;
  }

  function maxQtyOf(product) {
    var stock = product && typeof product.stock === "number" ? product.stock : MAX_QTY;
    if (stock <= 0) return 0;
    return Math.min(MAX_QTY, stock);
  }

  function money(value) {
    return shop ? shop.formatPrice(value) : "¥" + value;
  }

  function toast(text) {
    if (window.CShopUI && window.CShopUI.toast) window.CShopUI.toast(text);
  }

  /* ---------------- 状态读写 ---------------- */

  function sanitize(raw) {
    if (!Array.isArray(raw)) return [];

    var out = [];
    var seen = {};

    raw.forEach(function (entry) {
      if (!entry || !entry.id) return;

      var product = productOf(entry.id);
      if (!product) return; /* 商品已下架 */
      if (seen[entry.id]) return;

      var limit = maxQtyOf(product);
      if (limit <= 0) return; /* 缺货不进车 */

      var qty = Math.round(Number(entry.qty));
      if (!isFinite(qty) || qty < 1) qty = 1;
      if (qty > limit) qty = limit;

      seen[entry.id] = true;
      out.push({ id: entry.id, qty: qty });
    });

    return out;
  }

  function load() {
    var raw = null;
    try {
      raw = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    } catch (err) {
      raw = [];
    }
    items = sanitize(raw);
  }

  function persist() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items));
    } catch (err) {
      /* 隐私模式忽略 */
    }
  }

  function emit() {
    var state = snapshot();
    listeners.forEach(function (fn) {
      try {
        fn(state);
      } catch (err) {
        /* 单个订阅出错不影响其它 */
      }
    });
  }

  function commit() {
    persist();
    render();
    emit();
  }

  /* ---------------- 只读视图 ---------------- */

  function snapshot() {
    var rows = items
      .map(function (entry) {
        var product = productOf(entry.id);
        if (!product) return null;
        return {
          id: entry.id,
          qty: entry.qty,
          product: product,
          price: product.price,
          lineTotal: product.price * entry.qty,
          limit: maxQtyOf(product),
        };
      })
      .filter(Boolean);

    var count = rows.reduce(function (sum, row) {
      return sum + row.qty;
    }, 0);

    var total = rows.reduce(function (sum, row) {
      return sum + row.lineTotal;
    }, 0);

    return { rows: rows, count: count, total: total };
  }

  /* ---------------- 修改操作 ---------------- */

  function add(id, qty) {
    var product = productOf(id);
    if (!product) return { ok: false, reason: "NOT_FOUND" };

    var limit = maxQtyOf(product);
    if (limit <= 0) return { ok: false, reason: "SOLD_OUT" };

    var amount = Math.max(1, Math.round(Number(qty) || 1));
    var current = null;

    items.forEach(function (entry) {
      if (entry.id === id) current = entry;
    });

    if (current) {
      if (current.qty >= limit) return { ok: false, reason: "LIMIT", limit: limit };
      current.qty = Math.min(limit, current.qty + amount);
    } else {
      items.push({ id: id, qty: Math.min(limit, amount) });
    }

    commit();
    return { ok: true };
  }

  function setQty(id, qty) {
    var product = productOf(id);
    if (!product) return { ok: false, reason: "NOT_FOUND" };

    var limit = maxQtyOf(product);
    var target = Math.round(Number(qty));

    if (!isFinite(target) || target <= 0) return remove(id);
    if (target > limit) target = limit;

    var touched = false;
    items.forEach(function (entry) {
      if (entry.id !== id) return;
      entry.qty = target;
      touched = true;
    });

    if (!touched) return { ok: false, reason: "NOT_IN_CART" };

    commit();
    return { ok: true, qty: target };
  }

  function stepBy(id, delta) {
    var current = items.filter(function (entry) {
      return entry.id === id;
    })[0];

    if (!current) return { ok: false, reason: "NOT_IN_CART" };

    return setQty(id, current.qty + delta);
  }

  function remove(id) {
    var before = items.length;
    items = items.filter(function (entry) {
      return entry.id !== id;
    });

    if (items.length === before) return { ok: false, reason: "NOT_IN_CART" };

    commit();
    return { ok: true };
  }

  function clear() {
    if (!items.length) return { ok: false, reason: "EMPTY" };
    items = [];
    commit();
    return { ok: true };
  }

  /* ---------------- 抽屉界面 ---------------- */

  var ui = null;
  var clearTimer = null;

  function buildUI() {
    var scrim = document.createElement("div");
    scrim.className = "cart-scrim";

    var drawer = document.createElement("aside");
    drawer.className = "cart";
    drawer.setAttribute("aria-hidden", "true");
    drawer.setAttribute("aria-label", "购物车");
    drawer.innerHTML =
      '<header class="cart__head">' +
      '<h2 class="cart__title">购物车 <span class="cart__count" data-count>0 件</span></h2>' +
      '<button class="cart__close" type="button" data-close aria-label="关闭购物车">×</button>' +
      "</header>" +
      '<div class="cart__body" data-body></div>' +
      '<footer class="cart__foot" data-foot hidden>' +
      '<div class="cart__sum">' +
      '<span class="cart__sum-label">合计</span>' +
      '<span class="cart__sum-value" data-total>¥0</span>' +
      "</div>" +
      '<div class="cart__actions">' +
      '<button class="cart__clear" type="button" data-clear>清空</button>' +
      '<button class="cart__checkout" type="button" data-checkout>去结算</button>' +
      "</div>" +
      "</footer>";

    document.body.appendChild(scrim);
    document.body.appendChild(drawer);

    ui = {
      scrim: scrim,
      drawer: drawer,
      body: drawer.querySelector("[data-body]"),
      foot: drawer.querySelector("[data-foot]"),
      count: drawer.querySelector("[data-count]"),
      total: drawer.querySelector("[data-total]"),
      clearBtn: drawer.querySelector("[data-clear]"),
      closeBtn: drawer.querySelector("[data-close]"),
      checkout: drawer.querySelector("[data-checkout]"),
    };

    scrim.addEventListener("click", close);
    ui.closeBtn.addEventListener("click", close);

    ui.body.addEventListener("click", function (event) {
      var row = event.target.closest("[data-id]");
      if (!row) return;

      var id = row.dataset.id;

      if (event.target.closest("[data-step]")) {
        var delta = Number(event.target.closest("[data-step]").dataset.step);
        var result = stepBy(id, delta);
        if (result && result.reason === "NOT_IN_CART") return;
        return;
      }

      if (event.target.closest("[data-remove]")) {
        var product = productOf(id);
        remove(id);
        toast("已移除 " + (product ? product.name : "商品"));
        return;
      }
    });

    ui.clearBtn.addEventListener("click", function () {
      /* 两段式确认，避免误触 */
      if (ui.clearBtn.dataset.armed === "1") {
        window.clearTimeout(clearTimer);
        ui.clearBtn.dataset.armed = "0";
        ui.clearBtn.textContent = "清空";
        clear();
        toast("购物车已清空");
        return;
      }

      ui.clearBtn.dataset.armed = "1";
      ui.clearBtn.textContent = "确认清空";

      window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(function () {
        if (!ui) return;
        ui.clearBtn.dataset.armed = "0";
        ui.clearBtn.textContent = "清空";
      }, 2600);
    });

    ui.checkout.addEventListener("click", function () {
      var state = snapshot();
      if (!state.count) return;
      toast("共 " + state.count + " 件，结算功能即将上线");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) close();
    });
  }

  function rowTemplate(row) {
    var product = row.product;
    var media = product.image
      ? '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy" />'
      : '<svg viewBox="0 0 320 220" aria-hidden="true"><use href="#art-' +
        product.art +
        '"/></svg>';

    return (
      '<div class="cart__row" data-id="' +
      product.id +
      '">' +
      '<div class="cart__media">' +
      media +
      "</div>" +
      '<div class="cart__info">' +
      '<h3 class="cart__name">' +
      product.name +
      "</h3>" +
      '<p class="cart__desc">' +
      product.desc +
      "</p>" +
      '<div class="cart__line">' +
      '<span class="cart__price">' +
      money(row.lineTotal) +
      "<small>" +
      money(row.price) +
      " × " +
      row.qty +
      "</small></span>" +
      '<div class="cart-stepper">' +
      '<button type="button" data-step="-1"' +
      (row.qty <= 1 ? " disabled" : "") +
      ' aria-label="减少数量">−</button>' +
      '<span class="cart-stepper__num">' +
      row.qty +
      "</span>" +
      '<button type="button" data-step="1"' +
      (row.qty >= row.limit ? " disabled" : "") +
      ' aria-label="增加数量">+</button>' +
      "</div>" +
      "</div>" +
      '<button class="cart__remove" type="button" data-remove>移除</button>' +
      "</div>" +
      "</div>"
    );
  }

  function render() {
    if (!ui) return;

    var state = snapshot();

    ui.count.textContent = state.count + " 件";
    ui.total.textContent = money(state.total);
    ui.foot.hidden = state.count === 0;

    if (!state.count) {
      ui.body.innerHTML =
        '<div class="cart__empty">' +
        '<span class="cart__empty-icon"><svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M6.5 8h11l1 12h-13z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M9.2 8V6.4a2.8 2.8 0 0 1 5.6 0V8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
        "</svg></span>" +
        '<p class="cart__empty-title">购物车还是空的</p>' +
        '<p class="cart__empty-text">挑几件喜欢的，先放进车里</p>' +
        '<a class="cart__empty-link" href="products.html">去逛逛</a>' +
        "</div>";
      return;
    }

    ui.body.innerHTML = state.rows.map(rowTemplate).join("");
  }

  /* ---------------- 开关 ---------------- */

  function isOpen() {
    return !!(ui && ui.drawer.classList.contains("is-open"));
  }

  var lastFocus = null;

  function open() {
    if (!ui) buildUI();
    if (isOpen()) return;

    lastFocus = document.activeElement;
    ui.drawer.classList.add("is-open");
    ui.scrim.classList.add("is-open");
    ui.drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    window.setTimeout(function () {
      if (ui && ui.closeBtn) ui.closeBtn.focus({ preventScroll: true });
    }, 120);
  }

  function close() {
    if (!ui || !isOpen()) return;

    ui.drawer.classList.remove("is-open");
    ui.scrim.classList.remove("is-open");
    ui.drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lastFocus && lastFocus.focus) {
      try {
        lastFocus.focus({ preventScroll: true });
      } catch (err) {
        /* 元素已移除则忽略 */
      }
    }
  }

  function toggle() {
    if (isOpen()) close();
    else open();
  }

  /* ---------------- 外部订阅 ---------------- */

  function subscribe(fn) {
    if (typeof fn !== "function") return function () {};
    listeners.push(fn);
    fn(snapshot());
    return function () {
      listeners = listeners.filter(function (item) {
        return item !== fn;
      });
    };
  }

  /* 跨标签页同步 */
  window.addEventListener("storage", function (event) {
    if (event.key !== KEY) return;
    load();
    render();
    emit();
  });

  /* 商品卡上的「加入购物车」（事件委托，任意页面可用） */
  document.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-add]");
    if (!btn) return;

    event.preventDefault();
    event.stopPropagation();

    var result = add(btn.dataset.add, 1);
    var product = productOf(btn.dataset.add);

    if (!result.ok) {
      if (result.reason === "SOLD_OUT") toast("「" + (product ? product.name : "该商品") + "」暂时缺货");
      else if (result.reason === "LIMIT") toast("已达到该商品的购买上限");
      return;
    }

    btn.classList.add("is-done");
    window.setTimeout(function () {
      btn.classList.remove("is-done");
    }, 900);

    toast("已加入购物车");
  });

  /* ---------------- 初始化 ---------------- */

  load();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      buildUI();
      render();
    });
  } else {
    buildUI();
    render();
  }

  return {
    add: add,
    setQty: setQty,
    stepBy: stepBy,
    remove: remove,
    clear: clear,
    items: function () {
      return snapshot().rows;
    },
    count: function () {
      return snapshot().count;
    },
    total: function () {
      return snapshot().total;
    },
    subscribe: subscribe,
    open: open,
    close: close,
    toggle: toggle,
    isOpen: isOpen,
  };
})();
