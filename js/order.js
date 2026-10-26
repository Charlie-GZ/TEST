/* ============================================================
   CSHOP · 下单成功页
   读取 ?id= 对应的本地订单，展示订单号 / 金额 / 收货信息 / 清单
   ============================================================ */

(function () {
  "use strict";

  var auth = window.CShopAuth;
  var orders = window.CShopOrders;

  var session = auth.requireAuth("login.html");
  if (!session) return;

  var PAY_NAME = {
    wechat: "微信支付",
    alipay: "支付宝",
    card: "银行卡",
  };

  var els = {
    sub: document.getElementById("okSub"),
    card: document.getElementById("okCard"),
    id: document.getElementById("okId"),
    time: document.getElementById("okTime"),
    total: document.getElementById("okTotal"),
    pay: document.getElementById("okPay"),
    addr: document.getElementById("okAddr"),
    noteRow: document.getElementById("okNoteRow"),
    note: document.getElementById("okNote"),
    items: document.getElementById("okItems"),
  };

  function money(n) {
    return "¥" + Number(n || 0).toLocaleString("en-US");
  }

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* 下单时间：精确到秒，形如 2026-10-25 16:42:07 */
  function formatTime(ts) {
    var d = new Date(Number(ts) || Date.now());
    if (isNaN(d.getTime())) d = new Date();

    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }

    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      " " +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes()) +
      ":" +
      pad(d.getSeconds())
    );
  }

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  var order = id ? orders.find(session.account, id) : orders.list(session.account)[0];

  if (!order) {
    els.sub.textContent = "没有找到这笔订单，可能已被清理。";
    return;
  }

  els.card.hidden = false;
  els.id.textContent = order.id;
  els.time.textContent = formatTime(order.createdAt);
  els.total.textContent = money(order.total);
  els.pay.textContent = PAY_NAME[order.payment] || "在线支付";

  var addr = order.address;
  els.addr.textContent = addr
    ? addr.name +
      " " +
      addr.phone +
      " · " +
      [addr.province, addr.city, addr.district, addr.detail]
        .filter(Boolean)
        .join(" ")
    : "—";

  if (order.note) {
    els.noteRow.hidden = false;
    els.note.textContent = order.note;
  }

  els.items.innerHTML = (order.items || [])
    .map(function (item) {
      return (
        '<div class="co-item">' +
        (item.image
          ? '<img class="co-item__thumb" src="' + esc(item.image) + '" alt="" />'
          : '<span class="co-item__thumb"></span>') +
        '<div class="co-item__main">' +
        '<p class="co-item__name">' + esc(item.name) + "</p>" +
        '<p class="co-item__meta">' + money(item.price) + " × " + item.qty + "</p>" +
        "</div>" +
        '<span class="co-item__price">' + money(item.price * item.qty) + "</span>" +
        "</div>"
      );
    })
    .join("");
})();
