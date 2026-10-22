/* ============================================================
   CSHOP · 个人中心
   ------------------------------------------------------------
   资料编辑（昵称 / 性别 / 生日）+ 收货地址（省市区三级联动）
   ============================================================ */

(function () {
  "use strict";

  var auth = window.CShopAuth;
  auth.seed();

  var session = auth.requireAuth("login.html");
  if (!session) return;

  var toast = (window.CShopUI && window.CShopUI.toast) || function () {};
  var REGIONS = window.CS_REGIONS || {};

  var user = auth.findUser(session.account) || {
    account: session.account,
    username: session.username,
  };

  var els = {
    avatar: document.getElementById("pfAvatar"),
    name: document.getElementById("pfName"),
    account: document.getElementById("pfAccount"),
    since: document.getElementById("pfSince"),
    statAddress: document.getElementById("statAddress"),
    statDays: document.getElementById("statDays"),
    rowNickname: document.getElementById("rowNickname"),
    rowGender: document.getElementById("rowGender"),
    rowBirthday: document.getElementById("rowBirthday"),
    grid: document.getElementById("addrGrid"),
    addTop: document.getElementById("addAddressTop"),
    logout: document.getElementById("pfLogout"),
  };

  var GENDER_TEXT = { male: "男", female: "女", secret: "保密" };

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------------- 顶部信息 ---------------- */

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function renderUser() {
    user = auth.findUser(session.account) || user;

    var nickname = auth.displayNameOf(user) || "用户";
    els.avatar.src = auth.avatarOf(user);
    els.avatar.alt = nickname + " 的头像";
    els.name.textContent = nickname;
    els.account.textContent = user.account || "";

    var created = user.createdAt ? new Date(user.createdAt) : new Date();
    els.since.textContent =
      "加入于 " + created.getFullYear() + " 年 " + (created.getMonth() + 1) + " 月";

    var days = Math.max(
      1,
      Math.floor((Date.now() - (user.createdAt || Date.now())) / 86400000) + 1
    );
    els.statDays.textContent = days;

    /* 昵称 */
    els.rowNickname.textContent = nickname;
    els.rowNickname.classList.remove("is-empty");

    /* 性别 */
    if (user.gender && GENDER_TEXT[user.gender]) {
      els.rowGender.textContent = GENDER_TEXT[user.gender];
      els.rowGender.classList.remove("is-empty");
    } else {
      els.rowGender.textContent = "选择";
      els.rowGender.classList.add("is-empty");
    }

    /* 生日 */
    if (user.birthday) {
      var bp = user.birthday.split("-");
      els.rowBirthday.textContent =
        bp.length === 3
          ? Number(bp[0]) + " 年 " + Number(bp[1]) + " 月 " + Number(bp[2]) + " 日"
          : user.birthday;
      els.rowBirthday.classList.remove("is-empty");
    } else {
      els.rowBirthday.textContent = "填写生日解锁生日福利";
      els.rowBirthday.classList.add("is-empty");
    }

    var list = auth.listAddresses(session.account);
    els.statAddress.textContent = list.length;
  }

  /* ---------------- 弹层 ---------------- */

  var activeModal = null;

  function closeModal() {
    if (!activeModal) return;
    activeModal.remove();
    activeModal = null;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
  }

  function onKeydown(event) {
    if (event.key === "Escape") closeModal();
  }

  function openModal(options) {
    closeModal();

    var wrap = document.createElement("div");
    wrap.className = "pf-modal";
    wrap.innerHTML =
      '<div class="pf-modal__sheet" role="dialog" aria-modal="true">' +
      '<header class="pf-modal__head">' +
      '<h3 class="pf-modal__title">' +
      esc(options.title) +
      "</h3>" +
      '<button class="pf-modal__close" type="button" aria-label="关闭">×</button>' +
      "</header>" +
      '<div class="pf-modal__body">' +
      options.body +
      "</div>" +
      '<footer class="pf-modal__foot">' +
      '<button class="pf-btn pf-btn--ghost" type="button" data-close>取消</button>' +
      '<button class="pf-btn pf-btn--primary" type="button" data-ok>' +
      esc(options.okText || "保存") +
      "</button>" +
      "</footer>" +
      "</div>";

    document.body.appendChild(wrap);
    document.body.style.overflow = "hidden";
    activeModal = wrap;

    wrap.addEventListener("click", function (event) {
      if (event.target === wrap) closeModal();
      if (event.target.closest("[data-close]") || event.target.closest(".pf-modal__close")) {
        closeModal();
      }
    });

    document.addEventListener("keydown", onKeydown);

    var okBtn = wrap.querySelector("[data-ok]");
    okBtn.addEventListener("click", function () {
      if (options.onOk) options.onOk(wrap, closeModal);
    });

    return wrap;
  }

  /* ---------------- 昵称 ---------------- */

  function editNickname() {
    openModal({
      title: "修改昵称",
      body:
        '<div class="pf-field">' +
        "<label>昵称</label>" +
        '<input class="pf-input" id="mNickname" maxlength="16" value="' +
        esc(auth.displayNameOf(user)) +
        '" placeholder="2–16 个字符" />' +
        "</div>" +
        '<p class="pf-hint">昵称会显示在导航栏与订单信息中，每 30 天可修改一次。</p>',
      onOk: function (wrap, close) {
        var input = wrap.querySelector("#mNickname");
        var value = input.value.trim();

        if (value.length < 2 || value.length > 16) {
          input.focus();
          input.style.borderColor = "#e0242f";
          return;
        }

        auth.updateProfile(session.account, { nickname: value });
        user = auth.findUser(session.account) || user;
        renderUser();
        updateHello();
        close();
        toast("昵称已更新");
      },
    });
  }

  /* ---------------- 性别 ---------------- */

  function editGender() {
    var current = user.gender || "";

    openModal({
      title: "选择性别",
      body:
        '<div class="pf-field">' +
        "<label>性别</label>" +
        '<div class="pf-seg" id="mGender">' +
        ["male", "female", "secret"]
          .map(function (key) {
            return (
              '<button type="button" data-gender="' +
              key +
              '"' +
              (current === key ? ' class="is-on"' : "") +
              ">" +
              GENDER_TEXT[key] +
              "</button>"
            );
          })
          .join("") +
        "</div>" +
        "</div>" +
        '<p class="pf-hint">性别用于推荐尺码与配色，可随时修改。</p>',
      onOk: function (wrap, close) {
        var on = wrap.querySelector("#mGender .is-on");
        var value = on ? on.dataset.gender : "";

        auth.updateProfile(session.account, { gender: value || null });
        user = auth.findUser(session.account) || user;
        renderUser();
        close();
        toast("性别已更新");
      },
    });

    var box = activeModal.querySelector("#mGender");
    box.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-gender]");
      if (!btn) return;
      Array.prototype.forEach.call(box.children, function (child) {
        child.classList.toggle("is-on", child === btn);
      });
    });
  }

  /* ---------------- 生日 ---------------- */

  function editBirthday() {
    var now = new Date();
    var current = user.birthday || "";
    var parts = current ? current.split("-") : ["", "", ""];

    var years = [];
    for (var y = now.getFullYear(); y >= 1930; y -= 1) years.push(y);

    function options(list, placeholder, selected) {
      return (
        '<option value="">' + placeholder + "</option>" +
        list
          .map(function (item) {
            var value = String(item);
            return (
              '<option value="' +
              value +
              '"' +
              (value === String(selected) ? " selected" : "") +
              ">" +
              value +
              "</option>"
            );
          })
          .join("")
      );
    }

    openModal({
      title: "填写生日",
      body:
        '<div class="pf-field">' +
        "<label>生日</label>" +
        '<div class="pf-row3">' +
        '<select class="pf-select" id="mYear">' +
        options(years, "年", parts[0]) +
        "</select>" +
        '<select class="pf-select" id="mMonth">' +
        options(
          Array.from({ length: 12 }, function (_, i) { return i + 1; }),
          "月",
          parts[1]
        ) +
        "</select>" +
        '<select class="pf-select" id="mDay">' +
        options(
          Array.from({ length: 31 }, function (_, i) { return i + 1; }),
          "日",
          parts[2]
        ) +
        "</select>" +
        "</div>" +
        "</div>" +
        '<p class="pf-hint">填写后可在生日当月领取专属优惠与礼品。</p>',
      onOk: function (wrap, close) {
        var y = wrap.querySelector("#mYear").value;
        var m = wrap.querySelector("#mMonth").value;
        var d = wrap.querySelector("#mDay").value;

        if (!y || !m || !d) {
          toast("请选择完整的年月日");
          return;
        }

        var value = y + "-" + pad(Number(m)) + "-" + pad(Number(d));
        auth.updateProfile(session.account, { birthday: value });
        user = auth.findUser(session.account) || user;
        renderUser();
        close();
        toast("生日已保存，生日月福利已解锁");
      },
    });
  }

  /* ---------------- 导航问候语即时刷新 ---------------- */

  function updateHello() {
    var nameEl = document.querySelector(".nav__hello-name");
    if (nameEl) nameEl.textContent = auth.displayNameOf(user);
    var menuName = document.getElementById("menuName");
    if (menuName) menuName.textContent = auth.displayNameOf(user);
  }

  /* ---------------- 收货地址 ---------------- */

  function regionOptions(map, placeholder, selected) {
    var keys = Object.keys(map || {});
    return (
      '<option value="">' + placeholder + "</option>" +
      keys
        .map(function (id) {
          return (
            '<option value="' +
            id +
            '"' +
            (id === selected ? " selected" : "") +
            ">" +
            esc(map[id]) +
            "</option>"
          );
        })
        .join("")
    );
  }

  function fullAddress(item) {
    return [item.province, item.city, item.district, item.street, item.detail]
      .filter(Boolean)
      .join(" ");
  }

  function renderAddresses() {
    var list = auth.listAddresses(session.account);
    els.statAddress.textContent = list.length;

    var html = list
      .map(function (item) {
        return (
          '<article class="pf-addr" data-id="' +
          esc(item.id) +
          '">' +
          '<div class="pf-addr__top">' +
          '<span class="pf-addr__name">' +
          esc(item.name) +
          "</span>" +
          '<span class="pf-addr__phone">' +
          esc(item.phone) +
          "</span>" +
          (item.isDefault ? '<span class="pf-tag pf-tag--default">默认</span>' : "") +
          (item.tag ? '<span class="pf-tag pf-tag--type">' + esc(item.tag) + "</span>" : "") +
          "</div>" +
          '<p class="pf-addr__text">' +
          esc(fullAddress(item)) +
          "</p>" +
          '<div class="pf-addr__actions">' +
          '<button type="button" data-act="edit">编辑</button>' +
          '<button type="button" data-act="del">删除</button>' +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    html +=
      '<button class="pf-addr-add" type="button" id="addrAdd">' +
      '<span class="pf-addr-add__plus">+</span>' +
      "<span>增加新的收货地址</span>" +
      "</button>";

    els.grid.innerHTML = html;
  }

  function openAddressModal(address) {
    var editing = !!address;
    var item = address || {
      name: "",
      phone: "",
      province: "",
      city: "",
      district: "",
      street: "",
      detail: "",
      tag: "",
      isDefault: auth.listAddresses(session.account).length === 0,
    };

    var provinceMap = REGIONS["86"] || {};
    var provinceName = "";
    var cityName = "";
    var districtName = "";

    Object.keys(provinceMap).forEach(function (id) {
      if (item.province && provinceMap[id] === item.province) {
        provinceName = id;
      }
    });

    if (provinceName && REGIONS[provinceName]) {
      Object.keys(REGIONS[provinceName]).forEach(function (id) {
        if (REGIONS[provinceName][id] === item.city) cityName = id;
      });
    }

    if (cityName && REGIONS[cityName]) {
      Object.keys(REGIONS[cityName]).forEach(function (id) {
        if (REGIONS[cityName][id] === item.district) districtName = id;
      });
    }

    var tags = ["家", "公司", "学校"];

    openModal({
      title: editing ? "编辑收货地址" : "新增收货地址",
      okText: "保存地址",
      body:
        '<div class="pf-field">' +
        "<label>收货人</label>" +
        '<input class="pf-input" id="aName" maxlength="20" placeholder="请填写收货人姓名" value="' +
        esc(item.name) +
        '" />' +
        "</div>" +
        '<div class="pf-field">' +
        "<label>手机号码</label>" +
        '<input class="pf-input" id="aPhone" inputmode="numeric" maxlength="11" placeholder="11 位手机号" value="' +
        esc(item.phone) +
        '" />' +
        "</div>" +
        '<div class="pf-field">' +
        "<label>所在地区</label>" +
        '<div class="pf-row3">' +
        '<select class="pf-select" id="aProvince">' +
        regionOptions(provinceMap, "省份", provinceName) +
        "</select>" +
        '<select class="pf-select" id="aCity">' +
        (provinceName
          ? regionOptions(REGIONS[provinceName], "城市", cityName)
          : '<option value="">城市</option>') +
        "</select>" +
        '<select class="pf-select" id="aDistrict">' +
        (cityName
          ? regionOptions(REGIONS[cityName], "区 / 县", districtName)
          : '<option value="">区 / 县</option>') +
        "</select>" +
        "</div>" +
        "</div>" +
        '<div class="pf-field">' +
        "<label>街道 / 乡镇</label>" +
        '<input class="pf-input" id="aStreet" maxlength="30" placeholder="例如：中关村街道" value="' +
        esc(item.street) +
        '" />' +
        "</div>" +
        '<div class="pf-field">' +
        "<label>详细地址</label>" +
        '<input class="pf-input" id="aDetail" maxlength="60" placeholder="街道、门牌号、楼层、房间号等" value="' +
        esc(item.detail) +
        '" />' +
        "</div>" +
        '<div class="pf-field">' +
        "<label>地址标签</label>" +
        '<div class="pf-chips" id="aTags">' +
        tags
          .map(function (tag) {
            return (
              '<button type="button" data-tag="' +
              tag +
              '"' +
              (item.tag === tag ? ' class="is-on"' : "") +
              ">" +
              tag +
              "</button>"
            );
          })
          .join("") +
        "</div>" +
        "</div>" +
        '<div class="pf-field">' +
        '<label class="pf-switch"><input type="checkbox" id="aDefault"' +
        (item.isDefault ? " checked" : "") +
        " /> 设为默认收货地址</label>" +
        "</div>" +
        '<p class="pf-error" id="aError" hidden></p>',
      onOk: function (wrap, close) {
        var name = wrap.querySelector("#aName").value.trim();
        var phone = wrap.querySelector("#aPhone").value.trim();
        var pSel = wrap.querySelector("#aProvince");
        var cSel = wrap.querySelector("#aCity");
        var dSel = wrap.querySelector("#aDistrict");
        var street = wrap.querySelector("#aStreet").value.trim();
        var detail = wrap.querySelector("#aDetail").value.trim();
        var error = wrap.querySelector("#aError");
        var tagBtn = wrap.querySelector("#aTags .is-on");
        var isDefault = wrap.querySelector("#aDefault").checked;

        function fail(msg, field) {
          error.textContent = msg;
          error.hidden = false;
          if (field) field.focus();
        }

        if (name.length < 2) return fail("请填写收货人姓名", wrap.querySelector("#aName"));
        if (!/^1\d{10}$/.test(phone)) return fail("请填写正确的 11 位手机号", wrap.querySelector("#aPhone"));
        if (!pSel.value || !cSel.value || !dSel.value) return fail("请选择完整的省 / 市 / 区");
        if (!detail) return fail("请填写详细地址（门牌号）", wrap.querySelector("#aDetail"));

        auth.saveAddress(session.account, {
          id: item.id,
          name: name,
          phone: phone,
          province: pSel.options[pSel.selectedIndex].text,
          city: cSel.options[cSel.selectedIndex].text,
          district: dSel.options[dSel.selectedIndex].text,
          street: street,
          detail: detail,
          tag: tagBtn ? tagBtn.dataset.tag : "",
          isDefault: isDefault,
        });

        renderAddresses();
        close();
        toast(editing ? "地址已更新" : "地址已添加");
      },
    });

    var wrap = activeModal;

    /* 省 → 市 → 区 联动 */
    wrap.querySelector("#aProvince").addEventListener("change", function () {
      var city = REGIONS[this.value];
      wrap.querySelector("#aCity").innerHTML = city
        ? regionOptions(city, "城市", "")
        : '<option value="">城市</option>';
      wrap.querySelector("#aDistrict").innerHTML = '<option value="">区 / 县</option>';
    });

    wrap.querySelector("#aCity").addEventListener("change", function () {
      var district = REGIONS[this.value];
      wrap.querySelector("#aDistrict").innerHTML = district
        ? regionOptions(district, "区 / 县", "")
        : '<option value="">区 / 县</option>';
    });

    wrap.querySelector("#aTags").addEventListener("click", function (event) {
      var btn = event.target.closest("[data-tag]");
      if (!btn) return;
      Array.prototype.forEach.call(this.children, function (child) {
        child.classList.toggle("is-on", child === btn);
      });
    });
  }

  /* ---------------- 事件 ---------------- */

  document.querySelectorAll("[data-edit]").forEach(function (row) {
    row.addEventListener("click", function () {
      var key = row.dataset.edit;
      if (key === "nickname") editNickname();
      if (key === "gender") editGender();
      if (key === "birthday") editBirthday();
    });
  });

  els.addTop.addEventListener("click", function () {
    openAddressModal(null);
  });

  els.grid.addEventListener("click", function (event) {
    if (event.target.closest("#addrAdd")) {
      openAddressModal(null);
      return;
    }

    var btn = event.target.closest("[data-act]");
    if (!btn) return;

    var card = btn.closest(".pf-addr");
    var id = card.dataset.id;
    var list = auth.listAddresses(session.account);
    var target = list.filter(function (item) {
      return item.id === id;
    })[0];

    if (!target) return;

    if (btn.dataset.act === "edit") {
      openAddressModal(target);
      return;
    }

    if (btn.dataset.act === "del") {
      auth.removeAddress(session.account, id);
      renderAddresses();
      toast("地址已删除");
    }
  });

  els.logout.addEventListener("click", function () {
    auth.logout();
    window.location.replace("login.html");
  });

  /* ---------------- 滚动高亮 ---------------- */

  var sections = [
    { id: "basic", el: document.getElementById("basic") },
    { id: "address", el: document.getElementById("address") },
  ];
  var indexItems = Array.prototype.slice.call(
    document.querySelectorAll(".pf-index__item")
  );

  function syncIndex() {
    var activeId = sections[0].id;
    sections.forEach(function (item) {
      if (item.el.getBoundingClientRect().top <= 180) activeId = item.id;
    });

    indexItems.forEach(function (link) {
      link.classList.toggle(
        "is-active",
        link.getAttribute("href") === "#" + activeId
      );
    });
  }

  window.addEventListener("scroll", syncIndex, { passive: true });

  /* ---------------- 初始化 ---------------- */

  renderUser();
  renderAddresses();
  syncIndex();
})();
