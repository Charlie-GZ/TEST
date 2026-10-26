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

  function hasDetail(item) {
    return shop.hasDetail ? shop.hasDetail(item.id) : false;
  }

  /* ---------------- DOM ---------------- */

  var newGrid = document.getElementById("newGrid");
  var featuredGrid = document.getElementById("featuredGrid");

  var searchForm = document.getElementById("searchForm");
  var searchInput = document.getElementById("searchInput");
  var searchClear = document.getElementById("searchClear");

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

    if (!item) return;

    if (hasDetail(item)) {
      window.location.href = "product.html?id=" + encodeURIComponent(item.id);
      return;
    }

    toast("「" + item.name + "」详情页即将上线");
  });

  featuredGrid.addEventListener("click", function (event) {
    var media = event.target.closest("[data-product]");
    if (!media) return;

    var item = shop.all.filter(function (product) {
      return product.id === media.dataset.product;
    })[0];

    if (!item) return;

    if (hasDetail(item)) {
      window.location.href = "product.html?id=" + encodeURIComponent(item.id);
      return;
    }

    toast(
      item.stock > 0
        ? "「" + item.name + "」详情页即将上线"
        : "「" + item.name + "」正在补货中"
    );
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

  searchInput.addEventListener("input", updateSearchClear);

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    goSearch(searchInput.value);
  });

  searchClear.addEventListener("click", function () {
    searchInput.value = "";
    updateSearchClear();
    searchInput.focus();
  });

  /* ---------------- 主视觉按钮 ---------------- */

  document.getElementById("heroExplore").addEventListener("click", function () {
    window.location.href = "products.html";
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
