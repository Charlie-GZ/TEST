/* ============================================================
   CSHOP · 注册页交互
   ------------------------------------------------------------
   流程：选择注册方式 → 填写手机号/邮箱 → 设置密码 → 确认密码
   密码一致 → 显示“注册成功” → 停留 2 秒 → 跳回登录页
   ============================================================ */

(function () {
  "use strict";

  var auth = window.CShopAuth;

  var form = document.getElementById("registerForm");
  var methodBtns = Array.prototype.slice.call(
    document.querySelectorAll(".method-card")
  );
  var methodHint = document.getElementById("methodHint");
  var accountField = document.getElementById("accountField");
  var accountLabel = document.getElementById("regAccountLabel");
  var accountInput = document.getElementById("regAccount");
  var usernameInput = document.getElementById("regUsername");
  var passwordInput = document.getElementById("regPassword");
  var confirmInput = document.getElementById("regPasswordConfirm");
  var msg = document.getElementById("registerMsg");
  var submitBtn = document.getElementById("registerBtn");

  /* 头像 / 性别（选填） */
  var avatarBtn = document.getElementById("avatarBtn");
  var avatarPreview = document.getElementById("avatarPreview");
  var avatarUploadBtn = document.getElementById("avatarUpload");
  var avatarResetBtn = document.getElementById("avatarReset");
  var avatarFile = document.getElementById("avatarFile");
  var genderBtns = Array.prototype.slice.call(
    document.querySelectorAll(".gender__btn")
  );

  /* 裁剪弹层 */
  var cropper = document.getElementById("cropper");
  var cropperStage = document.getElementById("cropperStage");
  var cropperImg = document.getElementById("cropperImg");
  var cropperZoom = document.getElementById("cropperZoom");
  var cropperCancel = document.getElementById("cropperCancel");
  var cropperConfirm = document.getElementById("cropperConfirm");

  var DEFAULT_AVATAR = {
    male: "assets/avatars/avatar-male.png",
    female: "assets/avatars/avatar-female.png",
  };

  var profile = {
    gender: null, /* 'male' | 'female' | null */
    avatar: null, /* 自定义头像 dataURL */
  };

  var MAX_FILE_SIZE = 8 * 1024 * 1024;
  var zoomState = {
    natW: 0,
    natH: 0,
    stage: 0,
    cover: 1,
    scale: 1,
    x: 0,
    y: 0,
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    lastFocus: null,
  };

  var METHOD = {
    phone: {
      label: "手机号",
      placeholder: "请输入 11 位手机号",
      inputmode: "tel",
      autocomplete: "tel",
      empty: "请输入手机号",
      invalid: "请输入正确的手机号",
    },
    email: {
      label: "邮箱",
      placeholder: "12345678@example.com",
      inputmode: "email",
      autocomplete: "email",
      empty: "请输入邮箱地址",
      invalid: "请输入正确的邮箱地址",
    },
  };

  var currentMethod = null;
  var successTimer = null;

  auth.seed();

  /* ---------------- 提示信息 ---------------- */

  function showMsg(text, type) {
    msg.textContent = text;
    msg.classList.remove("is-error", "is-success");

    if (type === "success") {
      msg.classList.add("is-success");
      return;
    }

    msg.classList.add("is-error");
    /* 任何校验失败都抖动按钮 */
    shakeButton(submitBtn);
  }

  function clearMsg() {
    msg.textContent = "";
    msg.classList.remove("is-error", "is-success");
  }

  /* 密码不一致时：按钮抖一下 */
  function shakeButton(btn) {
    if (!btn) return;

    /* 主路径：Web Animations API，不受 prefers-reduced-motion 的 CSS 降级影响 */
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
    /* 强制重排，保证连续提交也能重复播放 */
    void btn.getBoundingClientRect();
    btn.classList.add("is-shake");

    btn.addEventListener("animationend", function handler() {
      btn.classList.remove("is-shake");
      btn.removeEventListener("animationend", handler);
    });
  }

  /* ---------------- 注册方式切换 ---------------- */

  function selectMethod(method) {
    if (currentMethod === method) return;

    currentMethod = method;

    methodBtns.forEach(function (btn) {
      btn.setAttribute(
        "aria-checked",
        String(btn.dataset.method === method)
      );
    });

    var config = METHOD[method];
    accountLabel.textContent = config.label;
    accountInput.value = "";
    accountInput.type = "text";
    accountInput.inputMode = config.inputmode;
    accountInput.setAttribute("autocomplete", config.autocomplete);
    accountInput.placeholder = config.placeholder;

    methodHint.textContent = "已选择" + config.label + "注册，请填写下方账号";
    methodHint.classList.add("is-ready");

    /* 首次选择才展开账号栏，并自动聚焦 */
    if (!accountField.classList.contains("is-visible")) {
      accountField.classList.add("is-visible");
      accountField.removeAttribute("aria-hidden");

      window.requestAnimationFrame(function () {
        accountField.scrollIntoView({ block: "nearest", behavior: "smooth" });
        accountInput.focus({ preventScroll: true });
      });
    }
  }

  methodBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectMethod(btn.dataset.method);
      clearMsg();
    });
  });

  /* ---------------- 密码可见性 ---------------- */

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

  [accountInput, usernameInput, passwordInput, confirmInput].forEach(function (
    input
  ) {
    input.addEventListener("input", function () {
      if (msg.classList.contains("is-error")) clearMsg();
    });
  });

  /* ---------------- 头像与性别 ---------------- */

  function currentAvatarSrc() {
    if (profile.avatar) return profile.avatar;
    return profile.gender === "female"
      ? DEFAULT_AVATAR.female
      : DEFAULT_AVATAR.male;
  }

  function updateAvatarPreview() {
    avatarPreview.src = currentAvatarSrc();
    avatarResetBtn.hidden = !profile.avatar;
    avatarPreview.alt = profile.avatar
      ? "已上传的自定义头像"
      : profile.gender === "female"
      ? "女生默认头像"
      : "男生默认头像";
  }

  genderBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.dataset.gender;
      /* 再次点击同一项可取消，保持“性别选填” */
      profile.gender = profile.gender === value ? null : value;

      genderBtns.forEach(function (item) {
        item.setAttribute(
          "aria-checked",
          String(item.dataset.gender === profile.gender)
        );
      });
      updateAvatarPreview();
    });
  });

  function pickFile() {
    avatarFile.value = "";
    avatarFile.click();
  }

  avatarBtn.addEventListener("click", pickFile);
  avatarUploadBtn.addEventListener("click", pickFile);

  avatarResetBtn.addEventListener("click", function () {
    profile.avatar = null;
    updateAvatarPreview();
    clearMsg();
  });

  avatarFile.addEventListener("change", function () {
    var file = avatarFile.files && avatarFile.files[0];
    if (!file) return;

    if (!/^image\//.test(file.type)) {
      showMsg("请选择图片文件（JPG / PNG 等）", "error");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showMsg("图片不能超过 8MB，请压缩后再试", "error");
      return;
    }

    var reader = new FileReader();
    reader.onload = function () {
      openCropper(String(reader.result));
    };
    reader.onerror = function () {
      showMsg("图片读取失败，请换一张试试", "error");
    };
    reader.readAsDataURL(file);
  });

  /* ---------------- 圆形取景裁剪 ---------------- */

  /* 让图片始终铺满圆形取景区，并把位移限制在边界内 */
  function applyTransform() {
    var zs = zoomState.cover * zoomState.scale;
    var dispW = zoomState.natW * zs;
    var dispH = zoomState.natH * zs;
    var maxX = Math.max(0, (dispW - zoomState.stage) / 2);
    var maxY = Math.max(0, (dispH - zoomState.stage) / 2);

    zoomState.x = Math.min(maxX, Math.max(-maxX, zoomState.x));
    zoomState.y = Math.min(maxY, Math.max(-maxY, zoomState.y));

    cropperImg.style.width = dispW + "px";
    cropperImg.style.height = dispH + "px";
    cropperImg.style.transform =
      "translate(-50%, -50%) translate(" +
      zoomState.x.toFixed(2) +
      "px, " +
      zoomState.y.toFixed(2) +
      "px)";
  }

  function resetViewport() {
    zoomState.stage = cropperStage.clientWidth;
    zoomState.cover = Math.max(
      zoomState.stage / zoomState.natW,
      zoomState.stage / zoomState.natH
    );
    zoomState.scale = 1;
    zoomState.x = 0;
    zoomState.y = 0;
    cropperZoom.value = "1";
    applyTransform();
  }

  function openCropper(src) {
    var probe = new Image();

    probe.onload = function () {
      zoomState.natW = probe.naturalWidth || probe.width;
      zoomState.natH = probe.naturalHeight || probe.height;
      zoomState.lastFocus = document.activeElement;

      cropperImg.src = src;
      cropper.hidden = false;
      document.body.classList.add("is-cropping");

      /* 弹层显示后才能量到取景区尺寸 */
      resetViewport();
      cropperConfirm.focus();
    };

    probe.onerror = function () {
      showMsg("这张图片无法解析，请换一张", "error");
    };

    probe.src = src;
  }

  function closeCropper() {
    if (cropper.hidden) return;
    cropper.hidden = true;
    document.body.classList.remove("is-cropping");

    if (zoomState.lastFocus && zoomState.lastFocus.focus) {
      zoomState.lastFocus.focus();
    }
  }

  function setScale(next) {
    var clamped = Math.min(3, Math.max(1, next));
    var ratio = clamped / zoomState.scale;

    zoomState.scale = clamped;
    zoomState.x *= ratio;
    zoomState.y *= ratio;
    cropperZoom.value = String(clamped);
    applyTransform();
  }

  cropperZoom.addEventListener("input", function () {
    setScale(parseFloat(cropperZoom.value));
  });

  cropperStage.addEventListener(
    "wheel",
    function (event) {
      event.preventDefault();
      setScale(zoomState.scale + (event.deltaY < 0 ? 0.12 : -0.12));
    },
    { passive: false }
  );

  cropperStage.addEventListener("pointerdown", function (event) {
    if (event.button !== undefined && event.button !== 0) return;

    zoomState.dragging = true;
    zoomState.startX = event.clientX;
    zoomState.startY = event.clientY;
    zoomState.originX = zoomState.x;
    zoomState.originY = zoomState.y;

    cropperStage.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  cropperStage.addEventListener("pointermove", function (event) {
    if (!zoomState.dragging) return;

    zoomState.x = zoomState.originX + (event.clientX - zoomState.startX);
    zoomState.y = zoomState.originY + (event.clientY - zoomState.startY);
    applyTransform();
  });

  function endDrag(event) {
    if (!zoomState.dragging) return;
    zoomState.dragging = false;

    if (
      event.pointerId !== undefined &&
      cropperStage.hasPointerCapture(event.pointerId)
    ) {
      cropperStage.releasePointerCapture(event.pointerId);
    }
  }

  cropperStage.addEventListener("pointerup", endDrag);
  cropperStage.addEventListener("pointercancel", endDrag);

  /* 键盘微调取景位置 */
  cropperStage.addEventListener("keydown", function (event) {
    var step = event.shiftKey ? 16 : 6;
    var move = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }[event.key];

    if (!move) return;
    event.preventDefault();
    zoomState.x += move[0];
    zoomState.y += move[1];
    applyTransform();
  });

  window.addEventListener("resize", function () {
    if (cropper.hidden) return;
    var prevStage = zoomState.stage;
    var prevX = zoomState.x;
    var prevY = zoomState.y;
    var prevScale = zoomState.scale;

    zoomState.stage = cropperStage.clientWidth;
    if (!prevStage || !zoomState.stage) return;

    var ratio = zoomState.stage / prevStage;
    zoomState.cover *= ratio;
    zoomState.x = prevX * ratio;
    zoomState.y = prevY * ratio;
    zoomState.scale = prevScale;
    applyTransform();
  });

  function cropAndUse() {
    var zs = zoomState.cover * zoomState.scale;
    var size = 256;
    var srcSize = zoomState.stage / zs;
    var sx = zoomState.natW / 2 - (zoomState.stage / 2 + zoomState.x) / zs;
    var sy = zoomState.natH / 2 - (zoomState.stage / 2 + zoomState.y) / zs;

    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(cropperImg, sx, sy, srcSize, srcSize, 0, 0, size, size);

    var dataUrl = null;
    try {
      dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    } catch (err) {
      dataUrl = null;
    }

    if (!dataUrl) {
      showMsg("头像处理失败，请换一张图片", "error");
      closeCropper();
      return;
    }

    profile.avatar = dataUrl;
    updateAvatarPreview();
    clearMsg();
    closeCropper();
  }

  cropperConfirm.addEventListener("click", cropAndUse);
  cropperCancel.addEventListener("click", closeCropper);

  cropper.addEventListener("click", function (event) {
    if (event.target === cropper) closeCropper();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !cropper.hidden) {
      closeCropper();
    }
  });

  updateAvatarPreview();

  /* ---------------- 提交 ---------------- */

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    /* 成功提示等待跳转期间，避免重复提交 */
    if (successTimer) return;

    if (!currentMethod) {
      showMsg("请先选择手机号或邮箱注册", "error");
      methodBtns[0].focus();
      return;
    }

    var config = METHOD[currentMethod];
    var account = accountInput.value.trim();
    var username = usernameInput.value.trim();
    var password = passwordInput.value;
    var confirm = confirmInput.value;

    if (!account) {
      showMsg(config.empty, "error");
      accountInput.focus();
      return;
    }

    var accountValid =
      currentMethod === "phone"
        ? auth.isValidPhone(account)
        : auth.isValidEmail(account);

    if (!accountValid) {
      showMsg(config.invalid, "error");
      accountInput.focus();
      return;
    }

    if (!username) {
      showMsg("请设置用户名", "error");
      usernameInput.focus();
      return;
    }

    if (!auth.isValidUsername(username)) {
      showMsg("用户名需为 2-16 位字母、数字、下划线或中文", "error");
      usernameInput.focus();
      return;
    }

    if (!password) {
      showMsg("请设置密码", "error");
      passwordInput.focus();
      return;
    }

    if (password.length < 6 || password.length > 20) {
      showMsg("密码长度需为 6-20 位", "error");
      passwordInput.focus();
      return;
    }

    /* 必须同时包含大写字母、小写字母和数字 */
    if (!auth.isStrongPassword(password)) {
      showMsg("密码要求包含大写字母、小写字母和数字，请重新输入", "error");
      passwordInput.focus();
      return;
    }

    /* 两次密码不一致 —— 按需求给出的固定文案 */
    if (password !== confirm) {
      showMsg("两次输入密码不一致，请重新输入", "error");
      confirmInput.select();
      return;
    }

    var result = auth.register({
      account: account,
      type: currentMethod,
      username: username,
      password: password,
      gender: profile.gender,
      avatar: profile.avatar,
    });

    if (!result.ok) {
      if (result.code === "DUPLICATE") {
        showMsg("该账号已注册，请直接登录", "error");
        accountInput.focus();
      } else if (result.code === "DUPLICATE_USERNAME") {
        showMsg("该用户名已被使用，换一个试试", "error");
        usernameInput.focus();
      } else {
        showMsg(config.invalid, "error");
        accountInput.focus();
      }
      return;
    }

    /* 注册成功：停留 2 秒后自动跳转登录页 */
    showMsg("注册成功", "success");
    auth.setPrefill(result.account);

    submitBtn.disabled = true;
    submitBtn.textContent = "跳转中...";
    form
      .querySelectorAll("input, button, .method-card")
      .forEach(function (el) {
        el.disabled = true;
      });

    successTimer = window.setTimeout(function () {
      window.location.href = "login.html";
    }, 2000);
  });
})();
