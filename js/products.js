/* ============================================================
   CSHOP · 商品数据
   ------------------------------------------------------------
   首页、商品页共用数据源
   字段说明：
   - category: cphone | cpad | cbook | accessories
   - art:      SVG 线稿（phone / tablet / laptop / headphones
               / charger / cable / powerbank），无图时使用
   - image:    真实商品图，有则优先于线稿
   - isNew:    卡片左上角显示「新品」
   - stock:    0 表示缺货，封面显示灰色「补货中...」
   - keywords: 搜索命中词
   ============================================================ */

(function (global) {
  "use strict";

  var CATEGORY = {
    cphone: { label: "CPhone", desc: "手机" },
    cpad: { label: "CPad", desc: "平板" },
    cbook: { label: "CBook", desc: "笔记本" },
    accessories: { label: "配件", desc: "配件" },
  };

  var PRODUCTS = [
    {
      id: "cphone-ing",
      name: "CPhone ING",
      desc: "6.5 英寸 · 接入 CIG-AI",
      price: 5999,
      category: "cphone",
      art: "phone",
      isNew: true,
      image: "assets/products/cphone-ing.jpg",
      zoom: 0.95,
      tags: ["CIG-AI", "新品"],
      keywords: ["手机", "cphone", "ing", "6.5", "ai", "cig-ai", "智能"],
      stock: 14,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cphone-21",
      name: "CPhone 21",
      desc: "6.3 英寸 · 全新影像",
      price: 4999,
      category: "cphone",
      art: "phone",
      isNew: true,
      image: "assets/products/cphone-21.jpg",
      zoom: 0.88,
      tags: ["四色", "热卖"],
      keywords: ["手机", "cphone", "21", "6.3", "天蓝", "影像"],
      stock: 16,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cphone-21-pro",
      name: "CPhone 21 Pro",
      desc: "6.5 英寸 · 紫色钛金属",
      price: 6499,
      category: "cphone",
      art: "phone",
      isNew: true,
      image: "assets/products/cphone-21pro.jpg",
      zoom: 0.95,
      tags: ["旗舰", "四摄"],
      keywords: ["手机", "cphone", "21", "pro", "6.5", "紫色", "钛金属"],
      stock: 10,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cphone-21-pro-max",
      name: "CPhone 21 Pro Max",
      desc: "6.7 英寸 · 黑钛机身",
      price: 7999,
      category: "cphone",
      art: "phone",
      isNew: true,
      image: "assets/products/cphone-21promax.jpg",
      zoom: 1,
      tags: ["旗舰", "大屏"],
      keywords: ["手机", "cphone", "21", "pro", "max", "6.7", "黑色", "钛金属"],
      stock: 8,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cphone-20",
      name: "CPhone 20",
      desc: "6.3 英寸 · 柔光玻璃背板",
      price: 3999,
      category: "cphone",
      art: "phone",
      image: "assets/products/cphone-20.jpg",
      zoom: 0.88,
      tags: ["四色", "轻薄"],
      keywords: ["手机", "cphone", "20", "6.3", "粉色", "柔光"],
      stock: 20,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cphone-sg",
      name: "CPhone SG",
      desc: "6.0 英寸 · 小屏旗舰",
      price: 4299,
      category: "cphone",
      art: "phone",
      image: "assets/products/cphone-sg.jpg",
      zoom: 0.8,
      tags: ["小屏", "新品"],
      keywords: ["手机", "cphone", "sg", "小屏", "6.0", "compact"],
      stock: 12,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cpad-mini-8",
      name: "CPad Lion 8",
      desc: "8.3 英寸 · 随身创作",
      price: 3299,
      category: "cpad",
      art: "tablet",
      image: "assets/products/cpad-lion8.png",
      cutout: true,
      zoom: 0.86,
      tags: ["便携", "新品"],
      keywords: ["平板", "cpad", "lion", "8", "便携", "随身"],
      stock: 30,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cpad-se",
      name: "CPad SE",
      desc: "11 英寸 · 高性价比",
      price: 2999,
      category: "cpad",
      art: "tablet",
      image: "assets/products/cpad-se.png",
      cutout: true,
      zoom: 0.9,
      tags: ["性价比", "新品"],
      keywords: ["平板", "cpad", "se", "11", "入门", "性价比"],
      stock: 25,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cpad-air-11",
      name: "CPad Air",
      desc: "11 英寸 · 轻办公搭档",
      price: 4999,
      category: "cpad",
      art: "tablet",
      isNew: true,
      image: "assets/products/cpad-air.png",
      cutout: true,
      zoom: 0.95,
      tags: ["轻薄", "新品"],
      keywords: ["平板", "cpad", "air", "11", "轻薄"],
      stock: 20,
      palette: ["#f6f8fb", "#e9eef4"],
    },
    {
      id: "cpad-board",
      name: "CPad Board",
      desc: "11 英寸 · 磁吸键盘套装",
      price: 1999,
      category: "cpad",
      art: "tablet",
      image: "assets/products/cpad-board.png",
      cutout: true,
      zoom: 0.95,
      tags: ["键盘", "新品"],
      keywords: ["平板", "cpad", "board", "键盘", "磁吸", "套装"],
      stock: 18,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cbook-fold",
      name: "CBook Fold Light",
      desc: "折叠双屏 · 轻量创作",
      price: 14999,
      category: "cbook",
      art: "laptop",
      isNew: true,
      image: "assets/products/cbook-fold.jpg",
      zoom: 0.95,
      tags: ["折叠屏", "双屏"],
      keywords: ["笔记本", "电脑", "cbook", "fold", "折叠", "双屏", "轻量"],
      stock: 8,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cbook-tai",
      name: "CBook TAI",
      desc: "23.8 英寸 · 一体机",
      price: 8999,
      category: "cbook",
      art: "laptop",
      image: "assets/products/cbook-tai.jpg",
      zoom: 0.92,
      tags: ["一体机", "新品"],
      keywords: ["一体机", "台式", "cbook", "tai", "23.8", "创作"],
      stock: 9,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cbook-air-14",
      name: "CBook Air X",
      desc: "14 英寸 · 1.24kg 轻薄本",
      price: 9499,
      category: "cbook",
      art: "laptop",
      image: "assets/products/cbook-airx.jpg",
      zoom: 0.92,
      tags: ["轻薄", "热卖"],
      keywords: ["笔记本", "电脑", "cbook", "air", "x", "14", "轻薄"],
      stock: 12,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cbook-pro-16",
      name: "CBook Pro",
      desc: "14 英寸 · 创作旗舰",
      price: 12999,
      category: "cbook",
      art: "laptop",
      image: "assets/products/cbook-pro.jpg",
      zoom: 0.88,
      tags: ["旗舰", "创作者"],
      keywords: ["笔记本", "电脑", "cbook", "pro", "14", "创作"],
      stock: 6,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cmaxing",
      name: "CMaxing",
      desc: "头戴式 · 主动降噪",
      price: 1999,
      category: "accessories",
      art: "headphones",
      isNew: true,
      image: "assets/products/cmaxing.jpg",
      zoom: 0.9,
      tags: ["头戴式", "降噪"],
      keywords: ["耳机", "头戴式", "cmaxing", "降噪", "配件"],
      stock: 15,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cwatch",
      name: "CWatch",
      desc: "智能手表 · 健康监测",
      price: 1299,
      category: "accessories",
      art: "phone",
      isNew: true,
      image: "assets/products/cwatch.jpg",
      zoom: 0.92,
      tags: ["智能手表", "健康"],
      keywords: ["手表", "智能手表", "cwatch", "健康", "运动", "配件"],
      stock: 20,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cpairs",
      name: "CPairs",
      desc: "真无线 · 主动降噪",
      price: 1299,
      category: "accessories",
      art: "headphones",
      image: "assets/products/cpairs.jpg",
      zoom: 0.95,
      tags: ["降噪", "真无线"],
      keywords: ["耳机", "真无线", "入耳", "cpairs", "降噪", "配件"],
      stock: 25,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cears",
      name: "CEars",
      desc: "耳夹式 · 轻盈无感",
      price: 999,
      category: "accessories",
      art: "headphones",
      image: "assets/products/cears.jpg",
      zoom: 0.95,
      tags: ["耳夹式", "轻盈"],
      keywords: ["耳机", "耳夹", "开放佩戴", "cears", "轻盈", "配件"],
      stock: 30,
      palette: ["#fbfbfc", "#f1f3f5"],
    },
    {
      id: "cpower-usb-head",
      name: "CPower-USB 充电头",
      desc: "60W · 单口快充",
      price: 199,
      category: "accessories",
      art: "charger",
      image: "assets/products/cpower-head.jpg",
      zoom: 0.96,
      tags: ["60W", "充电头"],
      keywords: ["充电头", "充电器", "快充", "usb-c", "60w", "cpower", "配件"],
      stock: 40,
      palette: ["#ffffff", "#ffffff"],
    },
    {
      id: "cpower-usb-cable",
      name: "CPower-USB 充电线",
      desc: "1 m · 60W 快充",
      price: 149,
      category: "accessories",
      art: "cable",
      image: "assets/products/cpower-cable.jpg",
      zoom: 0.95,
      tags: ["1m", "60W"],
      keywords: ["数据线", "充电线", "type-c", "usb-c", "60w", "cpower", "配件"],
      stock: 60,
      palette: ["#ffffff", "#ffffff"],
    },
    {
      id: "ccube",
      name: "Ccube",
      desc: "10000mAh · 磁吸无线",
      price: 499,
      category: "accessories",
      art: "powerbank",
      isNew: true,
      image: "assets/products/ccube.jpg",
      zoom: 0.92,
      tags: ["磁吸", "无线充"],
      keywords: ["充电宝", "移动电源", "磁吸", "无线充", "ccube", "配件"],
      stock: 30,
      palette: ["#ffffff", "#ffffff"],
    },
  ];

  function formatPrice(value) {
    return "¥" + Number(value).toLocaleString("en-US");
  }

  /* 商品卡片（首页与「探索所有商品」页共用） */
  function renderCard(item, index) {
    var soldOut = item.stock <= 0;
    var category = CATEGORY[item.category];

    var tags = ['<span class="chip chip--brand">' + category.desc + "</span>"]
      .concat(
        item.tags.slice(0, 2).map(function (tag) {
          return '<span class="chip">' + tag + "</span>";
        })
      )
      .join("");

    var mediaClass = "pcard__media";
    if (item.image) {
      mediaClass += item.cutout
        ? " pcard__media--cutout"
        : item.fit === "cover"
        ? " pcard__media--cover"
        : " pcard__media--photo";
    }

    return (
      '<article class="pcard" style="animation-delay:' +
      Math.min((index || 0) * 35, 210) +
      'ms">' +
      '<button class="' +
      mediaClass +
      '" type="button" data-product="' +
      item.id +
      '" style="--p1:' +
      item.palette[0] +
      ";--p2:" +
      item.palette[1] +
      ";--zoom:" +
      (item.zoom || 1) +
      '" aria-label="查看 ' +
      item.name +
      '">' +
      (item.isNew ? '<span class="pcard__new">新品</span>' : "") +
      (item.image
        ? '<img class="pcard__img" src="' +
          item.image +
          '" alt="' +
          item.name +
          '" loading="lazy" />'
        : '<span class="pcard__art"><svg viewBox="0 0 320 220" aria-hidden="true"><use href="#art-' +
          item.art +
          '"/></svg></span>') +
      (soldOut
        ? '<span class="pcard__oos"><span>补货中...</span></span>'
        : '<span class="pcard__cta">查看详情 →</span>') +
      "</button>" +
      '<div class="pcard__body">' +
      '<h3 class="pcard__name">' +
      item.name +
      "</h3>" +
      '<p class="pcard__desc">' +
      item.desc +
      "</p>" +
      '<div class="pcard__foot">' +
      '<p class="pcard__price">' +
      formatPrice(item.price) +
      "</p>" +
      '<button class="pcard__add" type="button" data-add="' +
      item.id +
      '"' +
      (soldOut ? " disabled" : "") +
      ' aria-label="将 ' +
      item.name +
      ' 加入购物车">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>' +
      "</button>" +
      "</div>" +
      '<div class="pcard__tags">' +
      tags +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function pick(ids) {
    return ids
      .map(function (id) {
        return PRODUCTS.filter(function (item) {
          return item.id === id;
        })[0];
      })
      .filter(Boolean);
  }

  /* 精选：笔记本 → 真无线耳机 → 平板 → 充电头 */
  function featured() {
    return pick(["cbook-air-14", "cpairs", "cpad-board", "cpower-usb-head"]);
  }

  /* 首页「新品探寻」固定展示的四款 */
  function latest() {
    return pick(["cphone-ing", "cbook-fold", "cmaxing", "cwatch"]);
  }

  /* 「新品」页：home 四款 + 另外五款 */
  function newArrivals() {
    return pick([
      "cphone-ing",
      "cbook-fold",
      "cmaxing",
      "cwatch",
      "ccube",
      "cpad-air-11",
      "cphone-21",
      "cphone-21-pro",
      "cphone-21-pro-max",
    ]);
  }

  function search(keyword) {
    var key = String(keyword || "").trim().toLowerCase();
    if (!key) return PRODUCTS.slice();

    return PRODUCTS.filter(function (item) {
      var haystack = [item.name, item.desc, CATEGORY[item.category].desc]
        .concat(item.tags)
        .concat(item.keywords)
        .join(" ")
        .toLowerCase();
      return haystack.indexOf(key) > -1;
    });
  }

  /* 已经做好详情页的商品（详情内容见 js/product-detail.js） */
  var DETAIL_IDS = ["cphone-ing", "cpad-mini-8", "cbook-fold", "cmaxing", "cwatch"];

  function hasDetail(id) {
    return DETAIL_IDS.indexOf(id) > -1;
  }

  function byCategory(category) {
    return PRODUCTS.filter(function (item) {
      return item.category === category;
    });
  }

  global.CShopProducts = {
    CATEGORY: CATEGORY,
    all: PRODUCTS,
    featured: featured,
    latest: latest,
    newArrivals: newArrivals,
    search: search,
    byCategory: byCategory,
    hasDetail: hasDetail,
    formatPrice: formatPrice,
    renderCard: renderCard,
  };
})(window);
