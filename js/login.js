/* ============================================================
   CSHOP · 登录页交互
   ============================================================ */

(function () {
  "use strict";

  var auth = window.CShopAuth;
  var form = document.getElementById("loginForm");
  var accountInput = document.getElementById("account");
  var passwordInput = document.getElementById("password");
  var msg = document.getElementById("loginMsg");
  var submitBtn = document.getElementById("loginBtn");

  auth.seed();

  /* 已登录则直接进入商城 */
  if (auth.getSession()) {
    window.location.replace("index.html");
    return;
  }

  /* 注册成功跳回时，自动带上刚注册的账号 */
  var prefill = auth.takePrefill();
  if (prefill) {
    accountInput.value = prefill;
    passwordInput.focus();
  } else {
    accountInput.focus();
  }

  /* 任何校验失败都抖动按钮 */
  function showError(text) {
    msg.textContent = text;
    msg.classList.remove("is-success");
    msg.classList.add("is-error");
    shakeButton(submitBtn);
  }

  function clearMsg() {
    msg.textContent = "";
    msg.classList.remove("is-error", "is-success");
  }

  /* 校验失败：按钮抖一下，给出更直接的反馈 */
  function shakeButton(btn) {
    if (!btn) return;

    /* 主路径：Web Animations API。
       不受 CSS 里 prefers-reduced-motion 的全局降级影响，
       也不会因样式表缓存而失效。 */
    if (typeof btn.animate === "function") {
      if (btn._shakeAnim) {
        btn._shakeAnim.cancel();
      }
      var baseShadow = "0 10px 24px -12px rgba(11, 13, 18, 0.55)";
      var errorShadow =
        "0 0 0 3px rgba(224, 36, 47, 0.22), 0 10px 24px -12px rgba(11, 13, 18, 0.55)";

      btn._shakeAnim = btn.animate(
        [
          { transform: "translateX(0)", boxShadow: baseShadow },
          { transform: "translateX(-12px)", boxShadow: errorShadow },
          { transform: "translateX(10px)", boxShadow: errorShadow },
          { transform: "translateX(-8px)", boxShadow: errorShadow },
          { transform: "translateX(6px)", boxShadow: baseShadow },
          { transform: "translateX(-4px)", boxShadow: baseShadow },
          { transform: "translateX(2px)", boxShadow: baseShadow },
          { transform: "translateX(0)", boxShadow: baseShadow },
        ],
        { duration: 520, easing: "cubic-bezier(0.36, 0.07, 0.19, 0.97)" }
      );
      return;
    }

    /* 兜底：老浏览器走 CSS 动画 */
    btn.classList.remove("is-shake");
    /* 强制重排，保证连续点击也能重复播放 */
    void btn.getBoundingClientRect();
    btn.classList.add("is-shake");

    btn.addEventListener("animationend", function handler() {
      btn.classList.remove("is-shake");
      btn.removeEventListener("animationend", handler);
    });
  }

  /* 密码可见性切换 */
  document.querySelectorAll("[data-toggle-password]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.getElementById(btn.dataset.togglePassword);
      if (!target) return;

      var willShow = target.type === "password";
      target.type = willShow ? "text" : "password";
      btn.setAttribute("aria-pressed", String(willShow));
      btn.setAttribute("aria-label", willShow ? "隐藏密码" : "显示密码");
      target.focus();
    });
  });

  [accountInput, passwordInput].forEach(function (input) {
    input.addEventListener("input", function () {
      if (msg.classList.contains("is-error")) clearMsg();
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var account = accountInput.value.trim();
    var password = passwordInput.value;

    if (!account || !password) {
      showError("请输入账号或密码，请重新输入");
      (!account ? accountInput : passwordInput).focus();
      return;
    }

    var result = auth.login(account, password);

    if (!result.ok) {
      showError("账号或密码错误，请重新输入");
      passwordInput.select();
      return;
    }

    clearMsg();
    submitBtn.disabled = true;
    submitBtn.textContent = "登录中...";

    window.setTimeout(function () {
      window.location.href = "index.html";
    }, 260);
  });
})();
