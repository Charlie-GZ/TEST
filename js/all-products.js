/* ============================================================
   CSHOP · 探索所有商品页
   ------------------------------------------------------------
   商品网格、品类筛选、顶部搜索联动、URL 参数（?cat=）
   ============================================================ */

(function () {
  "use strict";

  var shop = window.CShopProducts;
  var toast = window.CShopUI.toast;

  var grid = document.getElementById("allGrid");
  var empty = document.getElementById("allEmpty");
  var emptyText = document.getElementById("allEmptyText");
  var countEl = document.getElementById("allCount");
  var resetBtn = document.getElementById("allReset");
  var chips = Array.prototype.slice.call(
    document.querySelectorAll(".filter-chip")
  );

  var pageTitle = document.getElementById("pageTitle");
  var pageEyebrow = document.getElementById("pageEyebrow");

  var searchForm = document.getElementById("searchForm");
  var searchInput = document.getElementById("searchInput");
  var searchClear = document.getElementById("searchClear");

  var state = {
    category: "all",
    query: "",
    onlyNew: false,
  };

  /* ---------------- 数据 ---------------- */

  function currentList() {
    /* 新品页用固定清单（首页四款 + 另外五款），保持既定顺序 */
    var items = state.onlyNew ? shop.newArrivals().slice() : shop.all;

    if (state.category !== "all") {
      items = items.filter(function (item) {
        return item.category === state.category;
      });
    }

    if (state.query) {
      var matched = shop.search(state.query).map(function (item) {
        return item.id;
      });
      items = items.filter(function (item) {
        return matched.indexOf(item.id) > -1;
      });
    }

    return items;
  }

  /* ---------------- 渲染 ---------------- */

  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;

    var url = new URL(window.location.href);
    if (state.category === "all") {
      url.searchParams.delete("cat");
    } else {
      url.searchParams.set("cat", state.category);
    }
    if (state.onlyNew) {
      url.searchParams.set("new", "1");
    } else {
      url.searchParams.delete("new");
    }
    window.history.replaceState(null, "", url);
  }

  function render() {
    var items = currentList();

    grid.innerHTML = items.map(shop.renderCard).join("");
    grid.hidden = items.length === 0;
    empty.hidden = items.length > 0;

    countEl.textContent = items.length;

    if (!items.length) {
      emptyText.textContent = state.query
        ? "没有与“" + state.query + "”相关的商品，换个关键词或切换品类试试。"
        : "这个品类暂时没有商品，先看看其它品类吧。";
    }

    chips.forEach(function (chip) {
      chip.classList.toggle(
        "is-active",
        chip.dataset.filter === state.category
      );
    });

    syncUrl();
  }

  /* ---------------- 交互 ---------------- */

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      state.category = chip.dataset.filter;
      render();
    });
  });

  searchInput.addEventListener("input", function () {
    state.query = searchInput.value.trim();
    searchClear.hidden = !state.query;
    render();
  });

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    state.query = searchInput.value.trim();
    render();
    searchInput.blur();
  });

  searchClear.addEventListener("click", function () {
    searchInput.value = "";
    state.query = "";
    searchClear.hidden = true;
    render();
    searchInput.focus();
  });

  resetBtn.addEventListener("click", function () {
    state.category = "all";
    state.onlyNew = false;
    state.query = "";
    searchInput.value = "";
    searchClear.hidden = true;
    render();
  });

  grid.addEventListener("click", function (event) {
    var media = event.target.closest("[data-product]");
    if (!media) return;

    var item = shop.all.filter(function (product) {
      return product.id === media.dataset.product;
    })[0];

    if (!item) return;

    toast(
      item.stock > 0
        ? "「" + item.name + "」详情页即将上线"
        : "「" + item.name + "」正在补货中"
    );
  });

  /* ---------------- 初始化 ---------------- */

  var params = new URLSearchParams(window.location.search);
  var param = params.get("cat");
  var keyword = params.get("q");

  if (params.get("new") === "1") {
    state.onlyNew = true;
    if (pageTitle) pageTitle.textContent = "新品上市";
    if (pageEyebrow) pageEyebrow.textContent = "最新上架";
  }

  if (param && shop.CATEGORY[param]) {
    var cat = shop.CATEGORY[param];
    state.category = param;
    searchInput.placeholder = cat.label + " 商品";

    if (pageTitle) {
      pageTitle.textContent =
        cat.label === cat.desc ? cat.label : cat.label + " " + cat.desc;
    }
    if (pageEyebrow) pageEyebrow.textContent = "全部" + cat.desc;
  }

  /* 首页搜索直达：带 q 参数进来直接出结果 */
  if (keyword) {
    state.query = keyword;
    searchInput.value = keyword;
    searchClear.hidden = false;
  }

  render();
})();
