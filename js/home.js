/* ============================================================
   CSHOP · 首页交互
   ------------------------------------------------------------
   精选产品渲染、搜索联想（跳转到商品页）、分类入口、进场动画
   导航相关逻辑见 js/nav.js
   ============================================================ */

(function () {
  "use strict";

  var shop = window.CShopProducts;
  var toast = window.CShopUI.toast;

  /* ---------------- DOM ---------------- */

  var nav = document.getElementById("nav");
  var newGrid = document.getElementById("newGrid");
  var featuredGrid = document.getElementById("featuredGrid");

  var searchForm = document.getElementById("searchForm");
  var searchInput = document.getElementById("searchInput");
  var searchClear = document.getElementById("searchClear");
  var searchPanel = document.getElementById("searchPanel");
  var searchList = document.getElementById("searchList");
  var searchHint = document.getElementById("searchHint");

  var HOTS = ["耳机", "手机", "笔记本", "充电宝"];

  /* ---------------- 精选产品 ---------------- */

  function renderCards(container, items) {
    container.innerHTML = items
      .map(function (item, index) {
        return shop.renderCard(item, index);
      })
      .join("");
  }

  newGrid.addEventListener("click", function (event) {
    var media = event.target.closest("[data-product]");
    if (!media) return;

    var item = shop.all.filter(function (product) {
      return product.id === media.dataset.product;
    })[0];

    if (item) toast("「" + item.name + "」详情页即将上线");
  });

  featuredGrid.addEventListener("click", function (event) {
    var media = event.target.closest("[data-product]");
    if (!media) return;

    var item = shop.all.filter(function (product) {
      return product.id === media.dataset.product;
    })[0];

    if (item) {
      toast(
        item.stock > 0
          ? "「" + item.name + "」详情页即将上线"
          : "「" + item.name + "」正在补货中"
      );
    }
  });

  /* ---------------- 搜索（结果在商品页展示） ---------------- */

  function goSearch(keyword) {
    var key = String(keyword || "").trim();
    window.location.href = key
      ? "products.html?q=" + encodeURIComponent(key)
      : "products.html";
  }

  function updateSearchClear() {
    searchClear.hidden = !searchInput.value.trim();
  }

  function hidePanel() {
    searchPanel.hidden = true;
  }

  function rowTemplate(item) {
    var category = shop.CATEGORY[item.category];

    return (
      '<button class="search__row" type="button" data-fill="' +
      item.name +
      '">' +
      '<span class="search__thumb" style="background:linear-gradient(150deg,' +
      item.palette[0] +
      "," +
      item.palette[1] +
      ')"><svg viewBox="0 0 320 220" aria-hidden="true"><use href="#art-' +
      item.art +
      '"/></svg></span>' +
      '<span class="search__meta">' +
      '<span class="search__name">' +
      item.name +
      "</span>" +
      '<span class="search__sub">' +
      category.desc +
      " · " +
      item.tags[0] +
      "</span>" +
      "</span>" +
      '<span class="search__price">' +
      shop.formatPrice(item.price) +
      "</span>" +
      "</button>"
    );
  }

  function renderPanel() {
    var key = searchInput.value.trim();
    searchPanel.hidden = false;

    if (!key) {
      searchHint.textContent = "热门搜索";
      searchList.innerHTML = HOTS.map(function (hot) {
        return (
          '<button class="search__row" type="button" data-fill="' +
          hot +
          '">' +
          '<span class="search__thumb" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" style="width:16px;height:16px;margin:auto">' +
          '<circle cx="11" cy="11" r="6.4" fill="none" stroke="#9aa0ab" stroke-width="1.7"/>' +
          '<path d="M16 16l4.2 4.2" fill="none" stroke="#9aa0ab" stroke-width="1.7" stroke-linecap="round"/>' +
          "</svg></span>" +
          '<span class="search__meta"><span class="search__name">' +
          hot +
          "</span></span>" +
          "</button>"
        );
      }).join("");
      return;
    }

    var total = shop.search(key).length;
    var matches = shop.search(key).slice(0, 5);

    searchHint.textContent = total ? "找到 " + total + " 件商品" : "没有匹配结果";

    if (!matches.length) {
      searchList.innerHTML =
        '<p class="search__empty">没有找到与“' +
        key +
        '”相关的商品，试试“耳机”“手机”或“充电宝”。</p>';
      return;
    }

    searchList.innerHTML = matches.map(rowTemplate).join("");
  }

  searchInput.addEventListener("focus", renderPanel);

  searchInput.addEventListener("input", function () {
    updateSearchClear();
    renderPanel();
  });

  searchList.addEventListener("click", function (event) {
    var row = event.target.closest("[data-fill]");
    if (!row) return;
    goSearch(row.dataset.fill);
  });

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    goSearch(searchInput.value);
  });

  searchClear.addEventListener("click", function () {
    searchInput.value = "";
    updateSearchClear();
    renderPanel();
    searchInput.focus();
  });

  document.addEventListener("click", function (event) {
    if (!searchForm.contains(event.target)) hidePanel();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") hidePanel();
  });

  /* ---------------- 主视觉按钮 ---------------- */

  document.getElementById("heroExplore").addEventListener("click", function () {
    window.location.href = "products.html";
  });

  document.getElementById("heroLearn").addEventListener("click", function () {
    var featured = document.querySelector(".section");
    var top =
      featured.getBoundingClientRect().top +
      window.pageYOffset -
      nav.offsetHeight -
      16;
    window.scrollTo({ top: top, behavior: "smooth" });
  });

  /* ---------------- 进场动画 ---------------- */

  (function reveal() {
    if (!("IntersectionObserver" in window)) return;

    var sections = Array.prototype.slice.call(
      document.querySelectorAll("main .section")
    );

    sections.forEach(function (section) {
      section.classList.add("reveal");
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  })();

  /* ---------------- 窄屏搜索占位文案 ---------------- */

  (function responsivePlaceholder() {
    var origin = searchInput.getAttribute("placeholder");

    function sync() {
      searchInput.placeholder =
        window.innerWidth <= 560 ? "搜索" : origin;
    }

    sync();
    window.addEventListener("resize", sync);
  })();

  /* ---------------- 初始化 ---------------- */

  renderCards(newGrid, shop.latest());
  renderCards(featuredGrid, shop.featured());
  updateSearchClear();
})();
