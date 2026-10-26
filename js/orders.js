/* ============================================================
   CSHOP · 订单存储（本项目无后端，订单存在浏览器本地）
   ------------------------------------------------------------
   结构：[{ id, createdAt, items[], goodsTotal, shipping, total,
            address{}, payment, note, status }]
   ============================================================ */

window.CShopOrders = (function () {
  "use strict";

  function key(account) {
    return "cshop_orders_" + account;
  }

  function list(account) {
    try {
      var raw = window.localStorage.getItem(key(account));
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (err) {
      return [];
    }
  }

  function write(account, arr) {
    try {
      window.localStorage.setItem(key(account), JSON.stringify(arr));
    } catch (err) {
      /* 本地存储写满时静默失败，不影响下单流程 */
    }
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function makeId() {
    var d = new Date();
    var stamp =
      d.getFullYear().toString().slice(2) +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      pad(d.getHours()) +
      pad(d.getMinutes());
    var rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "CS" + stamp + rand;
  }

  function create(account, data) {
    var order = {
      id: makeId(),
      createdAt: Date.now(),
      items: data.items || [],
      goodsTotal: data.goodsTotal || 0,
      shipping: data.shipping || 0,
      total: data.total || 0,
      address: data.address || null,
      payment: data.payment || "wechat",
      note: data.note || "",
      status: "paid",
    };

    var arr = list(account);
    arr.unshift(order);
    write(account, arr.slice(0, 30));
    return order;
  }

  function find(account, id) {
    var hit = null;
    list(account).forEach(function (item) {
      if (item.id === id) hit = item;
    });
    return hit;
  }

  return {
    list: list,
    create: create,
    find: find,
  };
})();
