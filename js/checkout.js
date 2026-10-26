/* ============================================================
   CSHOP · 结算页
   ------------------------------------------------------------
   地址选择 / 新增 → 配送 → 支付方式 → 提交 → 模拟支付 → 成功页
   ============================================================ */

(function () {
  "use strict";

  var auth = window.CShopAuth;
  var cart = window.CShopCart;
  var orders = window.CShopOrders;
  var toast = window.CShopUI ? window.CShopUI.toast : function () {};
  var REGIONS = window.CS_REGIONS || {};

  var session = auth.requireAuth("login.html");
  if (!session) return;
  var account = session.account;

  var PAY_NAME = {
    wechat: "微信支付",
    alipay: "支付宝",
    card: "银行卡",
  };

  /* ---------------- 直购模式 ----------------
     详情页「立即下单」不经过购物车，把当前商品写进 sessionStorage
     再带 ?buynow=1 过来。这里只在带参数时读取，避免残留影响正常结算。 */

  var BUY_NOW_KEY = "cshop_buynow";
  var buyNow = null;

  (function readBuyNow() {
    var withParam =
      new URLSearchParams(window.location.search).get("buynow") === "1";

    if (!withParam) {
      try {
        window.sessionStorage.removeItem(BUY_NOW_KEY);
      } catch (err) {}
      return;
    }

    try {
      var raw = window.sessionStorage.getItem(BUY_NOW_KEY);
      var data = raw ? JSON.parse(raw) : null;

      if (data && data.id && Number(data.price) > 0) {
        buyNow = {
          product: {
            id: data.id,
            name: data.name,
            image: data.image || "",
          },
          price: Number(data.price),
          qty: Math.max(1, Number(data.qty) || 1),
          color: data.color || "",
        };
        buyNow.lineTotal = buyNow.price * buyNow.qty;
      }
    } catch (err) {
      buyNow = null;
    }
  })();

  function clearBuyNow() {
    try {
      window.sessionStorage.removeItem(BUY_NOW_KEY);
    } catch (err) {}
  }

  /* 结算清单：直购时只有这一件，否则读购物车 */
  function currentRows() {
    return buyNow ? [buyNow] : cart.items();
  }

  function currentCount() {
    if (buyNow) return buyNow.qty;
    return cart.count();
  }

  var state = {
    addresses: [],
    selectedId: null,
    payment: "wechat",
    tag: "家",
  };

  var els = {
    sub: document.getElementById("coSub"),
    addrList: document.getElementById("addrList"),
    addrEmpty: document.getElementById("addrEmpty"),
    addrNew: document.getElementById("addrNew"),
    addrEmptyBtn: document.getElementById("addrEmptyBtn"),
    form: document.getElementById("addrForm"),
    afName: document.getElementById("afName"),
    afPhone: document.getElementById("afPhone"),
    afProvince: document.getElementById("afProvince"),
    afCity: document.getElementById("afCity"),
    afDistrict: document.getElementById("afDistrict"),
    afDetail: document.getElementById("afDetail"),
    afDefault: document.getElementById("afDefault"),
    afError: document.getElementById("afError"),
    addrCancel: document.getElementById("addrCancel"),
    payList: document.getElementById("payList"),
    items: document.getElementById("coItems"),
    sumGoods: document.getElementById("sumGoods"),
    sumTotal: document.getElementById("sumTotal"),
    submitAmount: document.getElementById("submitAmount"),
    submit: document.getElementById("coSubmit"),
    note: document.getElementById("coNote"),
    modal: document.getElementById("payModal"),
    payBrand: document.getElementById("payBrand"),
    payAmount: document.getElementById("payAmount"),
    payHint: document.getElementById("payHint"),
    payDone: document.getElementById("payDone"),
    payQr: document.getElementById("payQr"),
    qrWrap: document.querySelector(".co-qr"),
    cardForm: document.getElementById("payCard"),
    cardNo: document.getElementById("cardNo"),
    cardExp: document.getElementById("cardExp"),
    cardCvv: document.getElementById("cardCvv"),
  };

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function money(n) {
    return "¥" + Number(n || 0).toLocaleString("en-US");
  }

  /* ---------------- 购物车为空 ---------------- */

  if (!buyNow && !cart.count()) {
    document.querySelector(".co__grid").innerHTML =
      '<div class="co-blank">' +
      '<p class="co-blank__title">购物车还是空的</p>' +
      '<p class="co-blank__sub">先去挑点东西，再回来结算吧。</p>' +
      '<a class="ok__btn ok__btn--primary" href="products.html">去逛逛</a>' +
      "</div>";
    els.sub.textContent = "共 0 件商品";
    return;
  }

  /* ---------------- 订单摘要 ---------------- */

  function renderSummary() {
    var rows = currentRows();
    var goods = rows.reduce(function (sum, row) {
      return sum + row.lineTotal;
    }, 0);

    els.items.innerHTML = rows
      .map(function (row) {
        return (
          '<div class="co-item">' +
          (row.product.image
            ? '<img class="co-item__thumb" src="' +
              esc(row.product.image) +
              '" alt="" />'
            : '<span class="co-item__thumb"></span>') +
          '<div class="co-item__main">' +
          '<p class="co-item__name">' +
          esc(row.product.name) +
          "</p>" +
          '<p class="co-item__meta">' +
          money(row.price) +
          " × " +
          row.qty +
          (row.color ? " · " + esc(row.color) : "") +
          "</p>" +
          "</div>" +
          '<span class="co-item__price">' +
          money(row.lineTotal) +
          "</span>" +
          "</div>"
        );
      })
      .join("");

    els.sub.textContent = "共 " + currentCount() + " 件商品";
    els.sumGoods.textContent = money(goods);
    els.sumTotal.textContent = money(goods);
    els.submitAmount.textContent = money(goods);
    els.payAmount.textContent = money(goods);

    state.goodsTotal = goods;
  }

  /* ---------------- 地址 ---------------- */

  function renderAddresses() {
    state.addresses = auth.listAddresses(account) || [];

    if (!state.addresses.length) {
      els.addrList.innerHTML = "";
      els.addrEmpty.hidden = false;
      state.selectedId = null;
      return;
    }

    els.addrEmpty.hidden = true;

    if (!state.selectedId) {
      var def =
        state.addresses.filter(function (item) {
          return item.isDefault;
        })[0] || state.addresses[0];
      state.selectedId = def.id;
    }

    els.addrList.innerHTML = state.addresses
      .map(function (item) {
        var active = item.id === state.selectedId;
        var region = [item.province, item.city, item.district]
          .filter(Boolean)
          .join(" ");

        return (
          '<div class="co-addr__item' +
          (active ? " is-active" : "") +
          '" data-addr="' +
          esc(item.id) +
          '" role="radio" tabindex="0" aria-checked="' +
          (active ? "true" : "false") +
          '">' +
          '<span class="co-addr__radio" aria-hidden="true"></span>' +
          '<div class="co-addr__body">' +
          '<div class="co-addr__top">' +
          '<span class="co-addr__name">' +
          esc(item.name) +
          "</span>" +
          '<span class="co-addr__phone">' +
          esc(item.phone) +
          "</span>" +
          (item.isDefault
            ? '<span class="co-addr__tag co-addr__tag--default">默认</span>'
            : "") +
          (item.tag
            ? '<span class="co-addr__tag">' + esc(item.tag) + "</span>"
            : "") +
          "</div>" +
          '<p class="co-addr__text">' +
          esc(region + " " + item.detail) +
          "</p>" +
          "</div>" +
          '<button class="co-addr__del" type="button" data-del="' +
          esc(item.id) +
          '">删除</button>' +
          "</div>"
        );
      })
      .join("");
  }

  els.addrList.addEventListener("click", function (event) {
    var del = event.target.closest("[data-del]");
    if (del) {
      var id = del.dataset.del;
      state.addresses = auth.removeAddress(account, id);
      if (state.selectedId === id) state.selectedId = null;
      renderAddresses();
      toast("地址已删除");
      return;
    }

    var item = event.target.closest("[data-addr]");
    if (!item) return;
    state.selectedId = item.dataset.addr;
    renderAddresses();
  });

  /* ---------------- 新增地址表单 ---------------- */

  function fillSelect(select, map, placeholder, selected) {
    var html = '<option value="">' + placeholder + "</option>";
    Object.keys(map || {}).forEach(function (id) {
      html +=
        '<option value="' +
        id +
        '"' +
        (id === selected ? " selected" : "") +
        ">" +
        esc(map[id]) +
        "</option>";
    });
    select.innerHTML = html;
  }

  function initForm() {
    fillSelect(els.afProvince, REGIONS["86"] || {}, "请选择省份", "");
    els.afCity.innerHTML = '<option value="">请先选省份</option>';
    els.afDistrict.innerHTML = '<option value="">请先选城市</option>';

    els.afProvince.addEventListener("change", function () {
      var cities = REGIONS[this.value] || {};
      fillSelect(els.afCity, cities, "请选择城市", "");
      els.afDistrict.innerHTML = '<option value="">请先选城市</option>';
    });

    els.afCity.addEventListener("change", function () {
      var districts = REGIONS[this.value] || {};
      fillSelect(els.afDistrict, districts, "请选择区县", "");
    });
  }

  function openForm() {
    els.form.hidden = false;
    els.afError.hidden = true;
    els.addrNew.textContent = "收起";
    els.afName.focus();
  }

  function closeForm() {
    els.form.hidden = true;
    els.addrNew.textContent = "+ 新增地址";
  }

  els.addrNew.addEventListener("click", function () {
    if (els.form.hidden) openForm();
    else closeForm();
  });

  if (els.addrEmptyBtn) {
    els.addrEmptyBtn.addEventListener("click", openForm);
  }
  els.addrCancel.addEventListener("click", closeForm);

  document.querySelectorAll(".co-tag").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".co-tag").forEach(function (other) {
        other.classList.toggle("is-active", other === btn);
      });
      state.tag = btn.dataset.tag;
    });
  });

  els.form.addEventListener("submit", function (event) {
    event.preventDefault();

    var name = els.afName.value.trim();
    var phone = els.afPhone.value.trim();
    var provinceId = els.afProvince.value;
    var cityId = els.afCity.value;
    var districtId = els.afDistrict.value;
    var detail = els.afDetail.value.trim();

    function fail(msg) {
      els.afError.textContent = msg;
      els.afError.hidden = false;
    }

    if (!name) return fail("请填写收货人姓名");
    if (!/^1[3-9]\d{9}$/.test(phone)) return fail("请填写 11 位有效手机号");
    if (!provinceId) return fail("请选择省份");
    if (!cityId) return fail("请选择城市");
    if (!districtId) return fail("请选择区县");
    if (detail.length < 4) return fail("详细地址请写得更具体一些");

    els.afError.hidden = true;

    var saved = auth.saveAddress(account, {
      name: name,
      phone: phone,
      province: (REGIONS["86"] || {})[provinceId] || "",
      city: (REGIONS[provinceId] || {})[cityId] || "",
      district: (REGIONS[cityId] || {})[districtId] || "",
      detail: detail,
      tag: state.tag,
      isDefault: els.afDefault.checked,
    });

    state.selectedId = saved.id;
    renderAddresses();
    closeForm();
    els.form.reset();
    els.afProvince.dispatchEvent(new Event("change"));
    document.querySelectorAll(".co-tag").forEach(function (btn, i) {
      btn.classList.toggle("is-active", i === 0);
    });
    state.tag = "家";
    toast("地址已保存");
  });

  /* ---------------- 支付方式 ---------------- */

  els.payList.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-pay]");
    if (!btn) return;

    state.payment = btn.dataset.pay;
    Array.prototype.forEach.call(els.payList.children, function (item) {
      var on = item === btn;
      item.classList.toggle("is-active", on);
      item.setAttribute("aria-checked", on ? "true" : "false");
    });
  });

  /* ---------------- 模拟二维码 ---------------- */

  function drawQr(seedText) {
    var c = els.payQr;
    var ctx = c.getContext("2d");
    var size = c.width;
    var cells = 29;
    var pad = 2;
    var step = Math.floor(size / (cells + pad * 2));

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);

    // 简易确定性随机：同一个订单号每次画出来一样
    var seed = 0;
    for (var i = 0; i < seedText.length; i++) {
      seed = (seed * 31 + seedText.charCodeAt(i)) % 100000;
    }
    function rnd() {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    }

    var origin = pad * step + Math.floor((size - (cells + pad * 2) * step) / 2);

    function block(cx, cy) {
      ctx.fillRect(origin + cx * step, origin + cy * step, step, step);
    }

    ctx.fillStyle = "#111";
    for (var y = 0; y < cells; y++) {
      for (var x = 0; x < cells; x++) {
        // 三个定位角留空，后面单独画
        var inFinder =
          (x < 8 && y < 8) ||
          (x > cells - 9 && y < 8) ||
          (x < 8 && y > cells - 9);
        if (inFinder) continue;
        if (rnd() > 0.52) block(x, y);
      }
    }

    function finder(cx, cy) {
      ctx.fillStyle = "#111";
      ctx.fillRect(origin + cx * step, origin + cy * step, step * 7, step * 7);
      ctx.fillStyle = "#fff";
      ctx.fillRect(
        origin + (cx + 1) * step,
        origin + (cy + 1) * step,
        step * 5,
        step * 5
      );
      ctx.fillStyle = "#111";
      ctx.fillRect(
        origin + (cx + 2) * step,
        origin + (cy + 2) * step,
        step * 3,
        step * 3
      );
    }

    finder(0, 0);
    finder(cells - 7, 0);
    finder(0, cells - 7);
  }

  /* ---------------- 支付弹层 ---------------- */

  function openModal() {
    var isCard = state.payment === "card";

    els.payBrand.textContent = PAY_NAME[state.payment];
    els.payAmount.textContent = money(state.goodsTotal);
    els.payHint.hidden = isCard; // 银行卡表单里已有说明，避免重复
    els.payHint.textContent = "请使用" + PAY_NAME[state.payment] + "扫一扫完成支付（模拟）";

    // 银行卡走表单，扫码支付走二维码
    els.qrWrap.hidden = isCard;
    els.cardForm.hidden = !isCard;
    els.payDone.textContent = isCard ? "确认支付" : "我已完成支付";

    if (isCard) {
      if (!els.cardNo.value) els.cardNo.focus();
    } else {
      drawQr(String(state.goodsTotal) + state.payment + Date.now());
    }

    els.modal.hidden = false;
    document.body.style.overflow = "hidden";
    if (!isCard) els.payDone.focus();
  }

  function closeModal() {
    els.modal.hidden = true;
    document.body.style.overflow = "";
  }

  /* 卡号每 4 位加空格 */
  els.cardNo.addEventListener("input", function () {
    var digits = this.value.replace(/\D/g, "").slice(0, 16);
    this.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  });

  els.cardExp.addEventListener("input", function () {
    var digits = this.value.replace(/\D/g, "").slice(0, 4);
    this.value = digits.length > 2 ? digits.slice(0, 2) + " / " + digits.slice(2) : digits;
  });

  els.cardCvv.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 4);
  });

  els.modal.addEventListener("click", function (event) {
    if (event.target.closest("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !els.modal.hidden) closeModal();
  });

  /* ---------------- 提交订单 ---------------- */

  els.submit.addEventListener("click", function () {
    if (!state.addresses.length) {
      toast("请先填写收货地址");
      openForm();
      return;
    }
    if (!state.selectedId) {
      toast("请选择收货地址");
      return;
    }
    if (!currentCount()) {
      toast(buyNow ? "商品信息已失效，请重新选择" : "购物车是空的");
      return;
    }
    openModal();
  });

  els.payDone.addEventListener("click", function () {
    var address = state.addresses.filter(function (item) {
      return item.id === state.selectedId;
    })[0];

    if (!address) {
      closeModal();
      toast("请重新选择收货地址");
      return;
    }

    var rows = currentRows();
    var goods = rows.reduce(function (sum, row) {
      return sum + row.lineTotal;
    }, 0);

    var order = orders.create(account, {
      items: rows.map(function (row) {
        return {
          id: row.product.id,
          name: row.product.name,
          price: row.price,
          qty: row.qty,
          image: row.product.image || "",
          color: row.color || "",
        };
      }),
      goodsTotal: goods,
      shipping: 0,
      total: goods,
      address: address,
      payment: state.payment,
      note: els.note.value.trim(),
    });

    /* 直购只清临时数据，不动用户购物车 */
    if (buyNow) clearBuyNow();
    else cart.clear();

    closeModal();
    window.location.href = "order.html?id=" + encodeURIComponent(order.id);
  });

  /* ---------------- 初始化 ---------------- */

  initForm();
  renderSummary();
  renderAddresses();

  if (!state.addresses.length) {
    document.querySelector(".co__grid").classList.add("co__grid--empty-addr");
  }
})();
