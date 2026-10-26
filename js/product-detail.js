/* ============================================================
   CSHOP · 商品详情页
   ------------------------------------------------------------
   数据：window.CShopDetails[商品 id]
   页面：product.html?id=xxx
   ============================================================ */

(function () {
  "use strict";

  var shop = window.CShopProducts;
  var cart = window.CShopCart;
  var toast = window.CShopUI ? window.CShopUI.toast : function () {};

  /* ---------------- 详情内容 ---------------- */

  var DETAILS = {
    "cphone-ing": {
      plate: "#f4f9fd",
      colors: [
        {
          name: "冰海蓝",
          swatch: "linear-gradient(148deg,#f4fcff 0%,#cfe6f6 55%,#a9cde6 100%)",
          images: [
            {
              src: "assets/products/cphone-ing/detail-1.jpg",
              thumb: "assets/products/cphone-ing/thumb-1.jpg",
              alt: "CPhone ING 正反面展示",
              label: "整机",
            },
            {
              src: "assets/products/cphone-ing/detail-2.jpg",
              thumb: "assets/products/cphone-ing/thumb-2.jpg",
              alt: "CPhone ING 轻薄机身侧面",
              label: "机身",
            },
            {
              src: "assets/products/cphone-ing/detail-3.jpg",
              thumb: "assets/products/cphone-ing/thumb-3.jpg",
              alt: "CPhone ING CIG-AI 屏幕",
              label: "屏幕",
            },
          ],
        },
      ],
      intro:
        "6.5 英寸 OLED 配水波白贝母背板，机身 7.4mm、172g。端侧 CIG-AI 直接跑在手机上，影像、翻译、摘要都不用联网。",
      sections: [
        {
          icon: "doc",
          title: "产品介绍",
          body:
            "<p>CPhone ING 是 CSHOP 第一款把端侧 AI 放进日常的手机。6.5 英寸 OLED 屏幕，2532×1170 分辨率，支持 120Hz 自适应刷新，滑动、阅读、游戏都能跟手。</p>" +
            "<p>背板采用水波流动纹理玻璃，光线扫过时会像水面一样缓缓移动；中框为铝合金，边缘做了 2.5D 收弧，单手握持不硌手。</p>" +
            "<p>整机 7.4mm 厚、172g 重，塞进了 4800mAh 电池和双扬声器，日常通勤、出差、追剧都不需要额外带充电宝。</p>",
        },
        {
          icon: "spec",
          title: "规格参数",
          body:
            '<dl class="pd-spec">' +
            "<dt>屏幕</dt><dd>6.5 英寸 OLED · 2532×1170 · 120Hz</dd>" +
            "<dt>芯片</dt><dd>CIG-A1 · 4nm 制程</dd>" +
            "<dt>内存</dt><dd>12GB LPDDR5</dd>" +
            "<dt>存储</dt><dd>256GB / 512GB</dd>" +
            "<dt>后置</dt><dd>5000 万主摄 + 1200 万超广角</dd>" +
            "<dt>前置</dt><dd>1200 万 · 支持人像虚化</dd>" +
            "<dt>尺寸</dt><dd>152.6 × 71.2 × 7.4 mm</dd>" +
            "<dt>重量</dt><dd>172g</dd>" +
            "<dt>防护</dt><dd>IP68 防尘防水</dd>" +
            "<dt>系统</dt><dd>COS 12 · 内置 CIG-AI</dd>" +
            "</dl>",
        },
        {
          icon: "wave",
          title: "CIG-AI 智慧接入",
          body:
            "<p>端侧 7B 模型直接运行在 CIG-A1 上，断网也能用：通话中实时生成摘要，会议录音自动整理成待办，拍照后一键抹掉路人。</p>" +
            "<p>所有推理都在设备内完成，原始数据不上传云端，相册、聊天、位置这些隐私内容不会离开手机。</p>" +
            "<p>支持中英日韩实时互译，对着菜单、路牌、说明书拍一下就能出中文。</p>",
        },
        {
          icon: "battery",
          title: "续航与充电",
          body:
            "<p>4800mAh 电池，中度使用可撑一天半；视频连续播放最长 21 小时。</p>" +
            "<p>66W 有线快充，30 分钟充到 70%；支持 15W 无线充电与 5W 反向充电，耳机、手表随手补电。</p>",
        },
      ],
    },

    "cpad-mini-8": {
      plate: "#f8f1ed",
      colors: [
        {
          name: "酒红色",
          swatch: "linear-gradient(148deg,#8d2b3d 0%,#5a1526 60%,#3d0d1a 100%)",
          images: [
            {
              src: "assets/products/cpad-lion-8/detail-1.jpg",
              thumb: "assets/products/cpad-lion-8/thumb-1.jpg",
              alt: "CPad Lion 8 酒红色 正反面",
              label: "整机",
            },
            {
              src: "assets/products/cpad-lion-8/detail-2.jpg",
              thumb: "assets/products/cpad-lion-8/thumb-2.jpg",
              alt: "CPad Lion 8 轻薄机身",
              label: "机身",
            },
            {
              src: "assets/products/cpad-lion-8/detail-3.jpg",
              thumb: "assets/products/cpad-lion-8/thumb-3.jpg",
              alt: "CPad Lion 8 高画质屏幕",
              label: "屏幕",
            },
          ],
        },
        {
          name: "山水绿",
          swatch: "linear-gradient(148deg,#2f8073 0%,#1c5c50 60%,#0f3b33 100%)",
          images: [
            {
              src: "assets/products/cpad-lion-8/detail-g1.jpg",
              thumb: "assets/products/cpad-lion-8/thumb-g1.jpg",
              alt: "CPad Lion 8 山水绿 正反面",
              label: "整机",
            },
            {
              src: "assets/products/cpad-lion-8/detail-g2.jpg",
              thumb: "assets/products/cpad-lion-8/thumb-g2.jpg",
              alt: "CPad Lion 8 山水绿 轻薄机身",
              label: "机身",
            },
            {
              src: "assets/products/cpad-lion-8/detail-g3.jpg",
              thumb: "assets/products/cpad-lion-8/thumb-g3.jpg",
              alt: "CPad Lion 8 山水绿 高画质屏幕",
              label: "屏幕",
            },
          ],
        },
      ],
      intro:
        "8.3 英寸、295g，单手就能握住的创作本。玻璃背板配金属中框，配上 CSHOP Pencil 随手就能画。",
      sections: [
        {
          icon: "doc",
          title: "产品介绍",
          body:
            "<p>CPad Lion 8 把 8.3 英寸的屏幕装进了 295g 的机身，通勤路上单手翻资料、咖啡馆里随手起稿都不费劲。</p>" +
            "<p>背板是 2.5D 弧边玻璃，酒红与山水绿两种配色在光下都会透出深浅渐变；中框为 6000 系铝合金，四角做了圆润收弧，长时间握着不硌手。</p>" +
            "<p>支持第二代 CSHOP Pencil，磁吸吸附即充；配合分屏，一边查资料一边记笔记不用来回切。</p>",
        },
        {
          icon: "spec",
          title: "规格参数",
          body:
            '<dl class="pd-spec">' +
            "<dt>屏幕</dt><dd>8.3 英寸 Liquid 视网膜 · 2266×1488</dd>" +
            "<dt>像素密度</dt><dd>326 ppi · 60Hz</dd>" +
            "<dt>芯片</dt><dd>CIG-A1 · 4nm</dd>" +
            "<dt>存储</dt><dd>128GB / 256GB</dd>" +
            "<dt>后置</dt><dd>1200 万 · 支持文档扫描</dd>" +
            "<dt>尺寸</dt><dd>195.4 × 134.8 × 6.3 mm</dd>" +
            "<dt>重量</dt><dd>295g</dd>" +
            "<dt>接口</dt><dd>USB-C · 支持外接硬盘</dd>" +
            "<dt>网络</dt><dd>Wi-Fi 6E · 可选 5G 版</dd>" +
            "</dl>",
        },
        {
          icon: "wave",
          title: "高画质显示",
          body:
            "<p>2266×1488 分辨率、326 ppi，字边缘干净，看漫画和 PDF 不糊边。P3 广色域，修图导出的颜色和屏幕上看到的一致。</p>" +
            "<p>支持原彩显示与环境光自适应，白天户外自动提亮，晚上关灯自动压暗，长时间看不刺眼。</p>",
        },
        {
          icon: "battery",
          title: "续航与充电",
          body:
            "<p>5100mAh 电池，本地视频连续播放最长 12 小时，记笔记、看资料一整天不用找插座。</p>" +
            "<p>20W USB-C 快充，30 分钟充到 45%；也支持用手机充电器应急补电。</p>",
        },
      ],
    },

    "cbook-fold": {
      plate: "#f9f3ea",
      colors: [
        {
          name: "曜石黑",
          swatch: "linear-gradient(148deg,#3a3a3c 0%,#1d1e20 55%,#0d0e10 100%)",
          images: [
            {
              src: "assets/products/cbook-fold/detail-1.jpg",
              thumb: "assets/products/cbook-fold/thumb-1.jpg",
              alt: "CBook Fold Light 展开状态",
              label: "整机",
            },
            {
              src: "assets/products/cbook-fold/detail-2.jpg",
              thumb: "assets/products/cbook-fold/thumb-2.jpg",
              alt: "CBook Fold Light 自由折叠",
              label: "折叠",
            },
            {
              src: "assets/products/cbook-fold/detail-3.jpg",
              thumb: "assets/products/cbook-fold/thumb-3.jpg",
              alt: "CBook Fold Light 沉浸双屏",
              label: "双屏",
            },
          ],
        },
      ],
      intro:
        "一块 17.6 英寸的折叠双屏，折起来只有一本书厚。展开是创作台，折起是随身本。",
      sections: [
        {
          icon: "doc",
          title: "产品介绍",
          body:
            "<p>CBook Fold Light 把两块 13.8 英寸 OLED 用一条铰链连起来，展开得到 17.6 英寸的完整画布，合上就是一本书的尺寸。</p>" +
            "<p>整机 1.29kg，最薄处 9.2mm。屏幕表面覆了柔性玻璃与抗反射涂层，户外看稿不会一片反光。</p>" +
            "<p>屏幕里的金色沙丘壁纸是随机附带的动态主题，会根据时间从晨曦渐变到暮色。</p>",
        },
        {
          icon: "spec",
          title: "规格参数",
          body:
            '<dl class="pd-spec">' +
            "<dt>屏幕</dt><dd>双 13.8 英寸 OLED · 展开 17.6 英寸</dd>" +
            "<dt>分辨率</dt><dd>3K · 100% P3 广色域</dd>" +
            "<dt>芯片</dt><dd>CIG-A1 Pro</dd>" +
            "<dt>内存</dt><dd>16GB LPDDR5X</dd>" +
            "<dt>存储</dt><dd>1TB SSD</dd>" +
            "<dt>尺寸</dt><dd>展开 396 × 274 × 4.9 mm</dd>" +
            "<dt>折叠</dt><dd>298 × 214 × 14.9 mm</dd>" +
            "<dt>重量</dt><dd>1.29kg</dd>" +
            "<dt>接口</dt><dd>双 USB-C · 支持 65W 反向供电</dd>" +
            "</dl>",
        },
        {
          icon: "wave",
          title: "自由折叠",
          body:
            "<p>铰链采用双轴水滴结构，能在 0–180° 之间任意停在某个角度，松手不下坠，官方标称 40 万次开合。</p>" +
            "<p>帐篷模式竖在桌上当第二块屏，笔记本模式半开压键盘，平板模式摊平手写——三种姿态不用改设置，系统自动切换布局。</p>",
        },
        {
          icon: "battery",
          title: "沉浸双屏",
          body:
            "<p>两块屏幕出厂做过逐台校色，中间接缝只有一条 3mm 的窄边，横跨双屏的窗口看起来是一整块画布。</p>" +
            "<p>剪片时一边时间轴一边预览，写稿时一边资料一边正文，不用再来回切窗口。</p>",
        },
      ],
    },

    cmaxing: {
      plate: "#f2f6fa",
      colors: [
        {
          name: "雾蓝",
          swatch: "linear-gradient(148deg,#ccd9e6 0%,#9db2c6 55%,#75899f 100%)",
          images: [
            {
              src: "assets/products/cmaxing/detail-1.jpg",
              thumb: "assets/products/cmaxing/thumb-1.jpg",
              alt: "CMaxing 头戴式耳机",
              label: "整机",
            },
            {
              src: "assets/products/cmaxing/detail-2.jpg",
              thumb: "assets/products/cmaxing/thumb-2.jpg",
              alt: "CMaxing 深度降噪",
              label: "降噪",
            },
            {
              src: "assets/products/cmaxing/detail-3.jpg",
              thumb: "assets/products/cmaxing/thumb-3.jpg",
              alt: "CMaxing 360 度环绕声场",
              label: "声场",
            },
          ],
        },
      ],
      intro:
        "40mm 动圈加自适应降噪，245g 的头戴式。戴上以后地铁、机舱、开放式办公室都安静下来。",
      sections: [
        {
          icon: "doc",
          title: "产品介绍",
          body:
            "<p>耳罩用慢回弹记忆棉包覆，压力分散在耳廓四周，戴眼镜也不会夹太阳穴；头梁是铝合金加皮革内衬，245g 压在头顶几乎没存在感。</p>" +
            "<p>两侧耳机可以向内折平，塞进随附的硬壳收纳包，背包侧袋就能装下。</p>",
        },
        {
          icon: "spec",
          title: "规格参数",
          body:
            '<dl class="pd-spec">' +
            "<dt>单元</dt><dd>40mm 动圈 · 镀钛振膜</dd>" +
            "<dt>降噪</dt><dd>自适应主动降噪 · 最深 -48dB</dd>" +
            "<dt>麦克风</dt><dd>6 麦阵列 · 通话降噪</dd>" +
            "<dt>蓝牙</dt><dd>5.4 · 支持双设备连接</dd>" +
            "<dt>续航</dt><dd>60 小时（开降噪 40 小时）</dd>" +
            "<dt>充电</dt><dd>USB-C · 10 分钟听 5 小时</dd>" +
            "<dt>重量</dt><dd>245g</dd>" +
            "</dl>",
        },
        {
          icon: "wave",
          title: "深度降噪",
          body:
            "<p>内外双馈麦克风每秒采样 48000 次，按环境噪声实时调整降噪曲线：地铁的低频轰鸣压得更深，办公室的人声则保留一点，不会闷得听不见报站。</p>" +
            "<p>长按耳罩切换到通透模式，摘不摘耳机都能听清对话。</p>",
        },
        {
          icon: "battery",
          title: "360° 环绕声场",
          body:
            "<p>看电影时声场会跟着头部转动固定在前方，像坐在影院中间；听歌则收成更贴耳的呈现，人声不会被拉远。</p>" +
            "<p>空间音频同时支持头部追踪，转头时声源位置保持稳定。</p>",
        },
      ],
    },

    cwatch: {
      plate: "#f7f1e4",
      colors: [
        {
          name: "曙光金",
          swatch: "linear-gradient(148deg,#f0dfb4 0%,#d3b378 55%,#a9853f 100%)",
          images: [
            {
              src: "assets/products/cwatch/detail-1.jpg",
              thumb: "assets/products/cwatch/thumb-1.jpg",
              alt: "CWatch 曙光金 整机",
              label: "整机",
            },
            {
              src: "assets/products/cwatch/detail-2.jpg",
              thumb: "assets/products/cwatch/thumb-2.jpg",
              alt: "CWatch 精准运动记录",
              label: "运动",
            },
            {
              src: "assets/products/cwatch/detail-3.jpg",
              thumb: "assets/products/cwatch/thumb-3.jpg",
              alt: "CWatch 全天候健康监测",
              label: "健康",
            },
          ],
        },
        {
          name: "甜美粉",
          swatch: "linear-gradient(148deg,#f9dbe3 0%,#e3a8b9 55%,#bf7f93 100%)",
          images: [
            {
              src: "assets/products/cwatch/detail-p1.jpg",
              thumb: "assets/products/cwatch/thumb-p1.jpg",
              alt: "CWatch 甜美粉 整机",
              label: "整机",
            },
            {
              src: "assets/products/cwatch/detail-p2.jpg",
              thumb: "assets/products/cwatch/thumb-p2.jpg",
              alt: "CWatch 甜美粉 精准运动记录",
              label: "运动",
            },
            {
              src: "assets/products/cwatch/detail-p3.jpg",
              thumb: "assets/products/cwatch/thumb-p3.jpg",
              alt: "CWatch 甜美粉 全天候健康监测",
              label: "健康",
            },
          ],
        },
      ],
      intro:
        "38g 的轻量机身，抬腕就有时间、心率、血氧和今天走了多少步。运动自己认，数据自己记。",
      sections: [
        {
          icon: "doc",
          title: "产品介绍",
          body:
            "<p>CWatch 用一块 1.9 英寸常亮屏把信息铺满表盘，阳光下自动提亮，抬手不用等屏幕点亮。</p>" +
            "<p>表壳是 7000 系铝合金，链带做了细密的拉丝纹理；整机 38g，戴着睡觉也不会压手腕。</p>" +
            "<p>5ATM 防水，洗手、淋雨、游泳都不用摘。</p>",
        },
        {
          icon: "spec",
          title: "规格参数",
          body:
            '<dl class="pd-spec">' +
            "<dt>屏幕</dt><dd>1.9 英寸 LTPO OLED · 常亮显示</dd>" +
            "<dt>芯片</dt><dd>CIG-W1</dd>" +
            "<dt>续航</dt><dd>18 小时（低功耗模式 36 小时）</dd>" +
            "<dt>防水</dt><dd>5ATM</dd>" +
            "<dt>定位</dt><dd>双频 GPS · 北斗</dd>" +
            "<dt>健康</dt><dd>心率 · 血氧 · 睡眠 · 体温</dd>" +
            "<dt>重量</dt><dd>38g（不含表带）</dd>" +
            "<dt>连接</dt><dd>蓝牙 5.3 · Wi-Fi</dd>" +
            "<dt>充电</dt><dd>磁吸快充 · 45 分钟充满</dd>" +
            "</dl>",
        },
        {
          icon: "wave",
          title: "精准运动记录",
          body:
            "<p>双频 GPS 在楼宇之间和树荫下也不容易飘点，跑完一圈轨迹能贴着你实际跑的路线走。</p>" +
            "<p>内置 100 多种运动模式，跑步、骑行、游泳会自动识别并开始记录，忘了按开始也不会漏掉。</p>",
        },
        {
          icon: "battery",
          title: "全天候健康监测",
          body:
            "<p>光学心率每 5 分钟采样一次，静息心率异常升高、血氧过低都会提醒；夜间自动记录睡眠分期。</p>" +
            "<p>房颤提醒会在后台持续检测不规则节律，数据只在本地处理。</p>",
        },
      ],
    },
  };

  window.CShopDetails = DETAILS;

  /* ---------------- 图标 ---------------- */

  var ICONS = {
    doc: '<path d="M6 4h8l4 4v12H6z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M14 4v4h4M9 12h6M9 16h4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    spec:
      '<path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="7" r="1.8" fill="#fff" stroke="currentColor" stroke-width="1.4"/><circle cx="16" cy="12" r="1.8" fill="#fff" stroke="currentColor" stroke-width="1.4"/><circle cx="9" cy="17" r="1.8" fill="#fff" stroke="currentColor" stroke-width="1.4"/>',
    wave:
      '<path d="M3 12c2.4-4 4.4-4 6.8 0S14 16 16.4 12 21 8 21 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M3 16.5c2.4-3.4 4.4-3.4 6.8 0s4.2 3.4 6.6 0 4.6-3.4 4.6 0" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>',
    battery:
      '<rect x="2.5" y="8" width="16" height="8.5" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="20" y="10.5" width="2" height="3.5" rx="1" fill="currentColor"/><path d="M5.5 10.8h7v3.9h-7z" fill="currentColor" opacity=".55"/>',
    chevron:
      '<path d="M6 9.5l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  function svg(name, cls) {
    return (
      '<svg class="' +
      cls +
      '" viewBox="0 0 24 24" aria-hidden="true">' +
      ICONS[name] +
      "</svg>"
    );
  }

  /* ---------------- 取数据 ---------------- */

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  var product = (shop ? shop.all : []).filter(function (item) {
    return item.id === id;
  })[0];

  if (!product) {
    window.location.replace("products.html");
    return;
  }

  var detail = DETAILS[product.id] || null;
  var fallbackImages = [{ src: product.image, alt: product.name, label: "整机" }];
  var colors =
    detail && detail.colors && detail.colors.length
      ? detail.colors
      : [{ name: "标准色" }];

  /* 每个颜色一套图；没有单独配图就退回商品主图 */
  var colorSets = colors.map(function (color) {
    return color.images && color.images.length ? color.images : fallbackImages;
  });

  var limit = Math.max(1, Math.min(99, Number(product.stock) || 1));
  var qty = 1;
  var colorIndex = 0;
  var imageIndex = 0;

  /* ---------------- 渲染 ---------------- */

  var els = {
    name: document.getElementById("pdName"),
    price: document.getElementById("pdPrice"),
    chips: document.getElementById("pdChips"),
    stock: document.getElementById("pdStock"),
    desc: document.getElementById("pdDesc"),
    stage: document.getElementById("pdStage"),
    thumbs: document.getElementById("pdThumbs"),
    badge: document.getElementById("pdBadge"),
    colorName: document.getElementById("pdColorName"),
    swatches: document.getElementById("pdSwatches"),
    qty: document.getElementById("pdQty"),
    add: document.getElementById("pdAdd"),
    buy: document.getElementById("pdBuy"),
    acc: document.getElementById("pdAcc"),
    crumb: document.getElementById("pdCrumbName"),
  };

  document.title = product.name + " · CSHOP";
  if (els.crumb) els.crumb.textContent = product.name;
  els.name.textContent = product.name;
  els.price.textContent = shop.formatPrice(product.price);

  var cat = shop.CATEGORY[product.category];
  var CAT_SLUG = {
    cphone: "cphone",
    cpad: "cpad",
    cbook: "cbook",
    accessories: "accessories",
  };

  /* 面包屑第二级跟随商品品类 */
  var crumbCat = document.getElementById("pdCrumbCat");
  if (crumbCat && cat) {
    crumbCat.textContent = cat.desc;
    crumbCat.href = "products.html?cat=" + (CAT_SLUG[product.category] || "");
  }
  var chips = ['<span class="pd-chip">' + cat.desc + "</span>"];
  (product.tags || []).forEach(function (tag) {
    chips.push('<span class="pd-chip pd-chip--sea">' + tag + "</span>");
  });
  els.chips.innerHTML = chips.join("");

  var soldOut = Number(product.stock) <= 0;
  els.stock.textContent = soldOut ? "暂时缺货" : "现货";
  els.stock.classList.toggle("is-out", soldOut);

  els.desc.textContent =
    (detail && detail.intro) || product.desc || "";

  if (product.isNew) els.badge.hidden = false;

  /* 图片：按当前颜色渲染一套（切换颜色时保留当前是第几张） */
  function renderGallery(keep) {
    var list = colorSets[colorIndex];
    var active = typeof keep === "number" ? Math.min(keep, list.length - 1) : 0;
    imageIndex = active;

    els.stage.innerHTML = list
      .map(function (img, i) {
        return (
          '<img class="pd-gallery__img' +
          (i === active ? " is-active" : "") +
          '" src="' +
          img.src +
          '" alt="' +
          img.alt +
          '" data-index="' +
          i +
          '"' +
          (i === active ? "" : ' loading="lazy"') +
          " />"
        );
      })
      .join("");

    els.thumbs.innerHTML = list
      .map(function (img, i) {
        return (
          '<button class="pd-thumb' +
          (i === active ? " is-active" : "") +
          '" type="button" role="tab" data-index="' +
          i +
          '" aria-selected="' +
          (i === active ? "true" : "false") +
          '" aria-label="' +
          (img.label || img.alt) +
          '"><img src="' +
          (img.thumb || img.src) +
          '" alt="' +
          img.alt +
          '" /></button>'
        );
      })
      .join("");
  }

  function showImage(index) {
    imageIndex = index;
    Array.prototype.forEach.call(
      els.stage.querySelectorAll(".pd-gallery__img"),
      function (el, i) {
        el.classList.toggle("is-active", i === index);
      }
    );
    Array.prototype.forEach.call(
      els.thumbs.querySelectorAll(".pd-thumb"),
      function (el, i) {
        el.classList.toggle("is-active", i === index);
        el.setAttribute("aria-selected", i === index ? "true" : "false");
      }
    );
  }

  els.thumbs.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-index]");
    if (!btn) return;
    showImage(Number(btn.dataset.index));
  });

  renderGallery(0);

  if (detail && detail.plate) {
    document.querySelector(".pd-gallery__frame").style.background = detail.plate;
  }

  /* 颜色 */
  els.colorName.textContent = colors[0].name;
  els.swatches.innerHTML = colors
    .map(function (color, i) {
      return (
        '<button class="pd-swatch' +
        (i === 0 ? " is-active" : "") +
        '" type="button" data-color="' +
        i +
        '" aria-label="' +
        color.name +
        '" title="' +
        color.name +
        '"><span style="background:' +
        (color.swatch || "#e8eaef") +
        '"></span></button>'
      );
    })
    .join("");

  els.swatches.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-color]");
    if (!btn) return;

    var next = Number(btn.dataset.color);
    if (next === colorIndex) return;

    colorIndex = next;
    els.colorName.textContent = colors[colorIndex].name;
    Array.prototype.forEach.call(
      els.swatches.querySelectorAll(".pd-swatch"),
      function (el, i) {
        el.classList.toggle("is-active", i === colorIndex);
      }
    );

    /* 换成这个颜色对应的整套图，保留当前看的是第几张 */
    renderGallery(imageIndex);
  });

  /* 数量 */
  function renderQty() {
    els.qty.textContent = qty;
    var minus = document.querySelector('[data-step="-1"]');
    var plus = document.querySelector('[data-step="1"]');
    if (minus) minus.disabled = qty <= 1;
    if (plus) plus.disabled = qty >= limit;
    els.add.disabled = soldOut;
    els.buy.disabled = soldOut;
  }

  document.querySelector(".pd-qty").addEventListener("click", function (event) {
    var btn = event.target.closest("[data-step]");
    if (!btn) return;
    var next = qty + Number(btn.dataset.step);
    qty = Math.max(1, Math.min(limit, next));
    renderQty();
  });

  renderQty();

  /* 折叠区 */
  els.acc.innerHTML = ((detail && detail.sections) || [
    {
      icon: "doc",
      title: "产品介绍",
      body: "<p>" + (product.desc || "") + "</p>",
    },
  ])
    .map(function (sec, i) {
      return (
        '<div class="pd-acc__item' +
        (i === 0 ? " is-open" : "") +
        '">' +
        '<button class="pd-acc__btn" type="button" aria-expanded="' +
        (i === 0 ? "true" : "false") +
        '">' +
        svg(sec.icon || "doc", "pd-acc__icon") +
        "<span>" +
        sec.title +
        "</span>" +
        svg("chevron", "pd-acc__chev") +
        "</button>" +
        '<div class="pd-acc__body"><div class="pd-acc__inner">' +
        sec.body +
        "</div></div>" +
        "</div>"
      );
    })
    .join("");

  function openBody(item) {
    var body = item.querySelector(".pd-acc__body");
    body.style.maxHeight = body.scrollHeight + 34 + "px";
  }

  function closeBody(item) {
    item.querySelector(".pd-acc__body").style.maxHeight = "0px";
  }

  var accItems = els.acc.querySelectorAll(".pd-acc__item");
  Array.prototype.forEach.call(accItems, function (item) {
    if (item.classList.contains("is-open")) openBody(item);
  });

  els.acc.addEventListener("click", function (event) {
    var btn = event.target.closest(".pd-acc__btn");
    if (!btn) return;
    var item = btn.parentNode;
    var isOpen = item.classList.contains("is-open");

    Array.prototype.forEach.call(accItems, function (other) {
      if (other !== item && other.classList.contains("is-open")) {
        other.classList.remove("is-open");
        other.querySelector(".pd-acc__btn").setAttribute("aria-expanded", "false");
        closeBody(other);
      }
    });

    item.classList.toggle("is-open", !isOpen);
    btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
    if (isOpen) closeBody(item);
    else openBody(item);
  });

  /* 窗口变宽时重新量高度，避免展开内容被截断 */
  window.addEventListener("resize", function () {
    Array.prototype.forEach.call(
      els.acc.querySelectorAll(".pd-acc__item.is-open"),
      openBody
    );
  });

  /* ---------------- 加购 / 下单 ---------------- */

  function addToCart() {
    var result = cart.add(product.id, qty);

    if (!result.ok) {
      if (result.reason === "SOLD_OUT") toast("「" + product.name + "」正在补货中");
      else if (result.reason === "LIMIT")
        toast("购物车里已达上限（" + (result.limit || limit) + " 台）");
      else toast("加入购物车失败，请稍后再试");
      return false;
    }

    return true;
  }

  els.add.addEventListener("click", function () {
    if (addToCart()) {
      toast("已加入购物车 · " + product.name + " ×" + qty);
    }
  });

  /* 立即下单：不经过购物车，直接把当前商品与数量带到结算页 */
  els.buy.addEventListener("click", function () {
    var color = colors[colorIndex];

    var buyNow = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || "",
      qty: qty,
      color: color ? color.name : "",
    };

    try {
      window.sessionStorage.setItem("cshop_buynow", JSON.stringify(buyNow));
    } catch (err) {
      toast("浏览器存储不可用，请改用加入购物车");
      return;
    }

    window.location.href = "checkout.html?buynow=1";
  });
})();
