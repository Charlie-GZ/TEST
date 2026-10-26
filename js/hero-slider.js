/* ============================================================
   CSHOP · 首屏轮播
   ------------------------------------------------------------
   双幻灯片（CBook Fold Light / CPhone ING）
   5 秒自动切换 · 点击按钮切换 · 切页过渡顺滑
   ============================================================ */

(function () {
  "use strict";

  var root = document.getElementById("heroSlide");
  var track = document.getElementById("heroTrack");
  if (!root || !track) return;

  var dots = Array.prototype.slice.call(root.querySelectorAll(".hero__dot"));
  var slides = Array.prototype.slice.call(track.children);
  var DURATION = 5000;

  var index = 0;
  var timer = null;

  /* 进度条重播：直接重置元素上的动画，确保与 5 秒计时对齐 */
  function restartBar() {
    var dot = dots[index];
    if (!dot) return;

    var fill = dot.querySelector(".hero__dot-bar i");
    if (!fill) return;

    fill.style.animation = "none";
    void fill.offsetWidth;
    fill.style.animation = "";
  }

  function render() {
    track.style.transform = "translateX(-" + index * 100 + "%)";
    root.dataset.active = String(index);

    dots.forEach(function (dot, i) {
      var on = i === index;
      dot.classList.toggle("is-active", on);
      dot.setAttribute("aria-selected", on ? "true" : "false");
    });

    slides.forEach(function (slide, i) {
      var on = i === index;
      slide.classList.toggle("is-active", on);
      slide.setAttribute("aria-hidden", on ? "false" : "true");
    });
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    if (slides.length < 2) return;

    /* 即使用户在系统里关掉了动画（prefers-reduced-motion），轮播也要继续跑，
       否则首屏会变成一张不动的图，等于轮播失效。
       这种模式下只是不做位移动画（见 css 里 .hero__track 的 transition: none），
       所以直接跳到下一屏，视觉上不会晃。 */
    timer = window.setInterval(function () {
      goTo(index + 1);
    }, DURATION);
  }

  function goTo(next, manual) {
    index = ((next % slides.length) + slides.length) % slides.length;
    render();
    restartBar();
    if (manual) start();
  }

  /* 按钮切换 */
  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      var target = Number(dot.dataset.index);
      if (target === index) {
        start();
        restartBar();
        return;
      }
      goTo(target, true);
    });
  });

  /* 键盘左右键（焦点在首屏内时） */
  root.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") {
      goTo(index + 1, true);
    } else if (event.key === "ArrowLeft") {
      goTo(index - 1, true);
    }
  });

  /* 切到后台时暂停，回来继续，避免定时器堆积 */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  render();
  start();
})();
