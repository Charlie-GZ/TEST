/* ============================================================
   CSHOP · 公共导航
   ------------------------------------------------------------
   登录态、问候语、头像菜单、购物车角标、轻提示、
   分类下拉、栏目高亮、滚动阴影
   ============================================================ */

(function () {
  "use strict";

  var auth = window.CShopAuth;
  auth.seed();

  /* 未登录直接打回登录页 */
  var session = auth.requireAuth("login.html");
  if (!session) return;

  var user = auth.findUser(session.account) || {
    username: session.username,
    account: session.account,
  };

  var nav = document.getElementById("nav");
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".nav__link")
  );
  var toastEl = document.getElementById("toast");

  /* ---------------- 账户区 ---------------- */

  var avatarSrc = auth.avatarOf(user);
  var navAvatar = document.getElementById("navAvatar");
  var menuAvatar = document.getElementById("menuAvatar");

  if (navAvatar) {
    navAvatar.src = avatarSrc;
    navAvatar.alt = (auth.displayNameOf(user) || "用户") + " 的头像";
  }
  if (menuAvatar) {
    menuAvatar.src = avatarSrc;
    menuAvatar.alt = navAvatar ? navAvatar.alt : "";
  }

  var displayName = auth.displayNameOf(user) || "用户";
  var menuName = document.getElementById("menuName");
  var menuAccount = document.getElementById("menuAccount");

  if (menuName) menuName.textContent = displayName;
  if (menuAccount) menuAccount.textContent = user.account || displayName;

  var userBtn = document.getElementById("userBtn");
  var userMenu = document.getElementById("userMenu");

  /* 头像右侧的问候语，点击同样进入个人中心 */
  if (userBtn) {
    var hello = document.createElement("a");
    hello.className = "nav__hello";
    hello.href = "profile.html";
    hello.title = "进入个人中心";
    hello.innerHTML =
      'Hi, <span class="nav__hello-name">' + displayName + "</span>";

    /* 放在头像容器之后，这样才和头像在同一行对齐 */
    var userWrapEl = userBtn.parentNode;
    userWrapEl.parentNode.insertBefore(hello, userWrapEl.nextSibling);

    hello.addEventListener("click", function (event) {
      if (document.body.dataset.page !== "profile") return;
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* 菜单里补一个「个人中心」入口 */
  if (userMenu) {
    var profileEntry = document.createElement("a");
    profileEntry.className = "user__item";
    profileEntry.href = "profile.html";
    profileEntry.textContent = "个人中心";
    userMenu.insertBefore(profileEntry, userMenu.firstChild);
  }

  function closeUserMenu() {
    if (!userMenu || !userBtn) return;
    userMenu.hidden = true;
    userBtn.setAttribute("aria-expanded", "false");
  }

  function openUserMenu() {
    if (!userMenu || !userBtn) return;
    userMenu.hidden = false;
    userBtn.setAttribute("aria-expanded", "true");
  }

  /* 头像点击 → 个人中心；已经在个人中心就回到页首 */
  if (userBtn) {
    userBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      closeUserMenu();

      if (document.body.dataset.page === "profile") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      window.location.href = "profile.html";
    });
  }

  /* 只有个人中心以外的页面，才允许悬停展开 */
  var allowHoverMenu = document.body.dataset.page !== "profile";

  /* 页面加载时若光标正好停在头像上，浏览器会自动补一次 mouseenter，
     这里要求「鼠标真的移动过」之后才响应悬停，避免一进页面就弹层 */
  var pointerMoved = false;

  function markPointerMoved(event) {
    if (event && event.isTrusted === false) return;
    pointerMoved = true;
    document.removeEventListener("mousemove", markPointerMoved, true);
    document.removeEventListener("touchstart", markPointerMoved, true);
  }

  document.addEventListener("mousemove", markPointerMoved, true);
  document.addEventListener("touchstart", markPointerMoved, true);

  if (allowHoverMenu && userBtn) {
    var userWrap = userBtn.parentNode;

    userWrap.addEventListener("mouseenter", function () {
      if (!pointerMoved) return;
      openUserMenu();
    });

    userWrap.addEventListener("mouseleave", function () {
      window.setTimeout(function () {
        if (userMenu && !userMenu.matches(":hover")) closeUserMenu();
      }, 140);
    });
  }

  window.addEventListener("pagehide", closeUserMenu);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) closeUserMenu();
  });

  document.addEventListener("click", function (event) {
    if (userMenu && !userMenu.hidden && !userMenu.contains(event.target)) {
      closeUserMenu();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeUserMenu();
  });

  var logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      auth.logout();
      window.location.replace("login.html");
    });
  }

  /* ---------------- 轻提示 ---------------- */

  var toastTimer = null;

  function showToast(text) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.classList.add("is-visible");

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2000);
  }

  /* ---------------- 购物车角标与入口 ---------------- */

  (function initCartEntry() {
    var badge = document.getElementById("cartBadge");
    var cartBtn = document.getElementById("cartBtn");
    var cart = window.CShopCart;

    if (badge && cart) {
      cart.subscribe(function (state) {
        badge.textContent = state.count;
        badge.hidden = state.count === 0;
      });
    }

    if (cartBtn) {
      cartBtn.addEventListener("click", function () {
        if (cart) {
          cart.open();
          return;
        }
        showToast("购物车正在加载，请稍候");
      });
    }
  })();

  /* 供各页面调用 */
  window.CShopUI = {
    toast: showToast,
    session: session,
    user: user,
  };

  /* ---------------- 导航下拉菜单 ---------------- */

  var navMenu = document.getElementById("navMenu");
  var navMenuBody = document.getElementById("navMenuBody");
  var navScrim = document.getElementById("navScrim");
  var navInner = navMenu ? navMenu.querySelector(".nav-menu__inner") : null;

  var menuOpen = false;
  var menuKey = null;
  var closeTimer = null;
  var resetTimer = null;
  var compact = window.matchMedia("(max-width: 860px)").matches;

  var NAV_MENUS = {
    新品: {
      primary: { title: "探索新品", links: [] },
      columns: [
        { title: "选购", links: ["全部新品", "以旧换新", "分期免息", "教育优惠"] },
        { title: "了解", links: ["新品速递", "产品对比", "使用指南"] },
      ],
    },
    CPhone: {
      primary: { title: "探索 CPhone", links: [] },
      columns: [
        {
          title: "选购",
          links: ["分期免息", "以旧换新", "运营商套餐", "保护壳与贴膜"],
        },
        { title: "CPhone 相关", links: ["影像力", "电池与续航", "技术支持", "配件"] },
      ],
    },
    CPad: {
      primary: { title: "探索 CPad", links: [] },
      columns: [
        { title: "选购", links: ["手写笔", "键盘与保护套", "分期免息", "教育优惠"] },
        { title: "CPad 相关", links: ["多任务", "手写笔记", "技术支持"] },
      ],
    },
    CBook: {
      primary: { title: "探索 CBook", links: [] },
      columns: [
        { title: "选购", links: ["教育优惠", "以旧换新", "分期免息", "扩展坞"] },
        { title: "CBook 相关", links: ["性能", "续航", "系统与软件", "技术支持"] },
      ],
    },
    配件: {
      primary: { title: "探索配件", links: [] },
      columns: [
        { title: "选购", links: ["耳机", "充电", "保护套", "线材"] },
        { title: "配件相关", links: ["兼容性", "以旧换新", "技术支持"] },
      ],
    },
  };

  var NAV_SLUG = {
    CPhone: "cphone",
    CPad: "cpad",
    CBook: "cbook",
    配件: "accessories",
  };

  /* 用真实商品数据填满每个分类的下拉目录 */
  (function fillMenusFromData() {
    var all = window.CShopProducts ? window.CShopProducts.all : [];

    Object.keys(NAV_MENUS).forEach(function (key) {
      var list;

      if (key === "新品") {
        list = all.filter(function (item) {
          return item.isNew;
        });
      } else {
        list = all.filter(function (item) {
          return item.category === NAV_SLUG[key];
        });
      }

      var names = list.map(function (item) {
        return item.name;
      });

      NAV_MENUS[key].primary.links = names.concat([
        key === "新品" ? "全部新品" : key === "配件" ? "全部配件" : "全部机型",
      ]);
    });
  })();

  /* 顶部栏目点击 → 对应页面 */
  function topLevelUrl(key) {
    if (key === "商品") return "products.html";
    if (key === "新品") return "products.html?new=1";
    if (NAV_SLUG[key]) return "products.html?cat=" + NAV_SLUG[key];
    return null;
  }

  /* 下拉项点击 → 单品搜索或品类页 */
  function menuItemUrl(text, key) {
    if (text.indexOf("全部") === 0) return topLevelUrl(key);

    var all = window.CShopProducts ? window.CShopProducts.all : [];
    var hit = all.some(function (item) {
      return item.name === text;
    });

    return hit ? "products.html?q=" + encodeURIComponent(text) : null;
  }

  /* 根据当前页面 / 分类参数点亮对应栏目 */
  (function markActiveLink() {
    var page = document.body.dataset.page;
    var params = new URLSearchParams(window.location.search);
    var cat = params.get("cat");
    var CAT_KEY = {
      cphone: "CPhone",
      cpad: "CPad",
      cbook: "CBook",
      accessories: "配件",
    };

    var activeKey = "";

    if (page === "home") {
      activeKey = "首页";
    } else if (page === "products") {
      if (params.get("new") === "1") {
        activeKey = "新品";
      } else if (cat && CAT_KEY[cat]) {
        activeKey = CAT_KEY[cat];
      } else {
        /* 直接搜索某个型号时，按该商品所属品类点亮 */
        var keyword = params.get("q");
        var hit = null;

        if (keyword && window.CShopProducts) {
          hit = window.CShopProducts.all.filter(function (item) {
            return item.name === keyword;
          })[0];
        }

        activeKey =
          hit && CAT_KEY[hit.category] ? CAT_KEY[hit.category] : "商品";
      }
    }

    navLinks.forEach(function (link) {
      link.classList.toggle("is-active", link.dataset.nav === activeKey);
    });
  })();

  function columnTemplate(title, links, isPrimary) {
    return (
      '<div class="nav-menu__col' +
      (isPrimary ? " nav-menu__col--primary" : "") +
      '">' +
      '<p class="nav-menu__heading">' +
      title +
      "</p>" +
      '<ul class="nav-menu__list">' +
      links
        .map(function (text) {
          return (
            '<li><button class="nav-menu__link" type="button" data-menu-link="' +
            text +
            '">' +
            text +
            "</button></li>"
          );
        })
        .join("") +
      "</ul></div>"
    );
  }

  function menuTemplate(data) {
    return (
      '<div class="nav-menu__grid">' +
      columnTemplate(data.primary.title, data.primary.links, true) +
      data.columns
        .map(function (col) {
          return columnTemplate(col.title, col.links, false);
        })
        .join("") +
      "</div>"
    );
  }

  function measureMenuHeight() {
    return navInner ? navInner.offsetHeight : 0;
  }

  function renderMenu(key) {
    if (navMenuBody) navMenuBody.innerHTML = menuTemplate(NAV_MENUS[key]);
  }

  function openMenu(key, link) {
    if (compact || !NAV_MENUS[key] || !navMenu) return;
    window.clearTimeout(closeTimer);
    window.clearTimeout(resetTimer);

    if (menuOpen && menuKey === key) return;

    var wasOpen = menuOpen;
    menuOpen = true;
    menuKey = key;
    navMenu.classList.remove("is-closing");

    navLinks.forEach(function (item) {
      item.classList.toggle("is-menu-open", item === link);
    });

    if (!wasOpen) {
      renderMenu(key);

      /* 高度瞬间到位，只让 clip-path 从顶部把面板「拉下来」 */
      navMenu.classList.add("is-instant");
      navMenu.style.height = measureMenuHeight() + "px";
      void navMenu.offsetHeight;
      navMenu.classList.remove("is-instant");

      navMenu.classList.add("is-open");
      if (navScrim) navScrim.classList.add("is-visible");
      navMenu.setAttribute("aria-hidden", "false");
      return;
    }

    /* 已展开时切换栏目：内容立即替换，高度平滑过渡 + 轻微淡入 */
    renderMenu(key);
    navMenu.style.height = measureMenuHeight() + "px";

    if (navMenuBody) {
      navMenuBody.classList.remove("is-swapping");
      void navMenuBody.offsetWidth;
      navMenuBody.classList.add("is-swapping");
    }
  }

  function closeMenu(instant) {
    if (!navMenu) return;
    window.clearTimeout(closeTimer);

    closeTimer = window.setTimeout(
      function () {
        if (!menuOpen) return;
        menuOpen = false;
        menuKey = null;

        navMenu.classList.remove("is-open");
        navMenu.classList.add("is-closing");
        if (navScrim) navScrim.classList.remove("is-visible");
        navMenu.setAttribute("aria-hidden", "true");

        navLinks.forEach(function (item) {
          item.classList.remove("is-menu-open");
        });

        /* 帘子收起后再把高度归零，避免收起过程被高度变化打断 */
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(function () {
          if (menuOpen) return;
          navMenu.classList.add("is-instant");
          navMenu.style.height = "0px";
          void navMenu.offsetHeight;
          navMenu.classList.remove("is-instant");
        }, 320);
      },
      instant ? 0 : 90
    );
  }

  /* ---------------- 栏目交互 ---------------- */

  navLinks.forEach(function (link) {
    link.addEventListener("mouseenter", function () {
      if (!NAV_MENUS[link.dataset.nav]) {
        closeMenu();
        return;
      }
      openMenu(link.dataset.nav, link);
    });

    link.addEventListener("focus", function () {
      if (!NAV_MENUS[link.dataset.nav]) {
        closeMenu(true);
        return;
      }
      openMenu(link.dataset.nav, link);
    });

    link.addEventListener("click", function () {
      var key = link.dataset.nav;

      if (key === "首页") {
        closeMenu(true);
        if (document.body.dataset.page === "home") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          window.location.href = "index.html";
        }
        return;
      }

      var url = topLevelUrl(key);
      if (url) {
        closeMenu(true);
        window.location.href = url;
        return;
      }

      openMenu(key, link);
    });
  });

  if (navMenu) {
    /* 面板本身也是悬停区，移入不关闭 */
    navMenu.addEventListener("mouseenter", function () {
      window.clearTimeout(closeTimer);
    });

    nav.addEventListener("mouseleave", function () {
      closeMenu();
    });

    nav.addEventListener("focusout", function (event) {
      if (!nav.contains(event.relatedTarget)) closeMenu(true);
    });

    if (navMenuBody) {
      navMenuBody.addEventListener("click", function (event) {
        var item = event.target.closest("[data-menu-link]");
        if (!item) return;

        var text = item.dataset.menuLink;
        var url = menuItemUrl(text, menuKey);

        closeMenu(true);

        if (url) {
          window.location.href = url;
          return;
        }

        showToast("「" + text + "」页面即将上线");
      });
    }

    if (navScrim) {
      navScrim.addEventListener("click", function () {
        closeMenu(true);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menuOpen) closeMenu(true);
    });

    window.addEventListener(
      "scroll",
      function () {
        if (menuOpen) closeMenu(true);
      },
      { passive: true }
    );

    window.addEventListener("resize", function () {
      compact = window.matchMedia("(max-width: 860px)").matches;
      if (compact && menuOpen) closeMenu(true);
    });
  }

  /* ---------------- 导航滚动阴影 ---------------- */

  function syncNavShadow() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  window.addEventListener("scroll", syncNavShadow, { passive: true });
  syncNavShadow();

  /* ---------------- 个人中心里的搜索兜底 ---------------- */

  (function bindSearchFallback() {
    if (document.body.dataset.page !== "profile") return;

    var form = document.getElementById("searchForm");
    var input = document.getElementById("searchInput");
    if (!form || !input) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var key = input.value.trim();
      window.location.href = key
        ? "products.html?q=" + encodeURIComponent(key)
        : "products.html";
    });
  })();
})();
