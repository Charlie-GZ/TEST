/* ============================================================
   CSHOP · 账号与登录态（localStorage）
   ------------------------------------------------------------
   - 注册信息真实落库到 localStorage，可用新账号登录
   - 内置演示账号：demo / 123456
   - 登录态写入 localStorage，未登录访问内页会被打回登录页
   ============================================================ */

(function (global) {
  "use strict";

  var USERS_KEY = "cshop_users_v1";
  var SESSION_KEY = "cshop_session_v1";
  var PREFILL_KEY = "cshop_prefill_account";

  var DEMO_ACCOUNT = "demo";
  var DEMO_PASSWORD = "123456";

  /* ---------------- 存储 ---------------- */

  function safeParse(raw, fallback) {
    try {
      var data = JSON.parse(raw);
      return data === null || data === undefined ? fallback : data;
    } catch (err) {
      return fallback;
    }
  }

  function readUsers() {
    var users = safeParse(global.localStorage.getItem(USERS_KEY), []);
    return Array.isArray(users) ? users : [];
  }

  function writeUsers(users) {
    global.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  /* 首次进入时写入演示账号 */
  function seed() {
    var users = readUsers();
    var demoIndex = -1;

    users.forEach(function (user, index) {
      if (normalize(user.account) === DEMO_ACCOUNT) demoIndex = index;
    });

    if (demoIndex === -1) {
      users.unshift({
        account: DEMO_ACCOUNT,
        username: DEMO_ACCOUNT,
        password: DEMO_PASSWORD,
        type: "account",
        createdAt: Date.now(),
      });
      writeUsers(users);
      return;
    }

    /* 兼容旧数据：早期版本没有 username 字段 */
    if (!users[demoIndex].username) {
      users[demoIndex].username = DEMO_ACCOUNT;
      writeUsers(users);
    }
  }

  /* ---------------- 工具 ---------------- */

  /* 邮箱不区分大小写，手机号/用户名按原样（统一去空格） */
  function normalize(account) {
    var value = String(account == null ? "" : account).trim();
    return value.indexOf("@") > -1 ? value.toLowerCase() : value;
  }

  function isValidPhone(value) {
    return /^1[3-9]\d{9}$/.test(String(value).trim());
  }

  function isValidEmail(value) {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
      String(value).trim()
    );
  }

  /* 用户名：2-16 位，字母 / 数字 / 下划线 / 中文 */
  function isValidUsername(value) {
    return /^[A-Za-z0-9_\u4e00-\u9fa5]{2,16}$/.test(String(value).trim());
  }

  /* 密码强度：必须同时包含大写字母、小写字母和数字 */
  function isStrongPassword(value) {
    var pwd = String(value == null ? "" : value);
    return /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd);
  }

  /* 账号与用户名都可以作为登录名，逐个比对 */
  function findUser(account) {
    var key = normalize(account);
    if (!key) return null;

    var users = readUsers();
    for (var i = 0; i < users.length; i += 1) {
      if (normalize(users[i].account) === key) return users[i];
      if (users[i].username && normalize(users[i].username) === key) {
        return users[i];
      }
    }
    return null;
  }

  /* ---------------- 注册 ---------------- */

  /**
   * @param {{account:string,type:'phone'|'email',username:string,password:string}} payload
   * @returns {{ok:boolean,code?:string,account?:string}}
   */
  function register(payload) {
    var account = normalize(payload.account);
    var username = String(payload.username == null ? "" : payload.username).trim();
    var type = payload.type;

    if (!account) return { ok: false, code: "EMPTY_ACCOUNT" };
    if (type === "phone" && !isValidPhone(account)) {
      return { ok: false, code: "BAD_PHONE" };
    }
    if (type === "email" && !isValidEmail(account)) {
      return { ok: false, code: "BAD_EMAIL" };
    }
    if (!username) return { ok: false, code: "EMPTY_USERNAME" };
    if (!isValidUsername(username)) return { ok: false, code: "BAD_USERNAME" };
    if (findUser(account)) return { ok: false, code: "DUPLICATE" };
    if (findUser(username)) return { ok: false, code: "DUPLICATE_USERNAME" };

    var users = readUsers();
    users.push({
      account: account,
      username: username,
      password: payload.password,
      type: type,
      gender: payload.gender === "male" || payload.gender === "female"
        ? payload.gender
        : null,
      avatar: payload.avatar || null,
      createdAt: Date.now(),
    });
    writeUsers(users);

    return { ok: true, account: account, username: username };
  }

  /* ---------------- 头像 ---------------- */

  var DEFAULT_AVATARS = {
    male: "assets/avatars/avatar-male.png",
    female: "assets/avatars/avatar-female.png",
  };

  /* 自定义头像优先；否则按性别取默认图；未选性别用男生默认图 */
  function avatarOf(user) {
    if (user && user.avatar) return user.avatar;
    var gender = user && user.gender;
    return DEFAULT_AVATARS[gender] || DEFAULT_AVATARS.male;
  }

  /* ---------------- 登录态 ---------------- */

  function login(account, password) {
    var user = findUser(account);
    if (!user || user.password !== password) {
      return { ok: false };
    }

    var session = {
      account: user.account,
      username: user.username || user.account,
      gender: user.gender || null,
      type: user.type,
      loginAt: Date.now(),
    };
    global.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, session: session };
  }

  function getSession() {
    var session = safeParse(global.localStorage.getItem(SESSION_KEY), null);
    if (!session || !session.account) return null;
    return session;
  }

  function logout() {
    global.localStorage.removeItem(SESSION_KEY);
  }

  /* 未登录直接打回登录页；返回当前会话 */
  function requireAuth(loginPath) {
    var session = getSession();
    if (!session) {
      global.location.replace(loginPath || "login.html");
      return null;
    }
    return session;
  }

  /* ---------------- 个人资料 ---------------- */

  /* 昵称：优先 nickname，其次注册时的 username */
  function displayNameOf(user) {
    if (!user) return "";
    return user.nickname || user.username || user.account || "";
  }

  function readIndex(users, account) {
    var key = normalize(account);
    for (var i = 0; i < users.length; i += 1) {
      if (normalize(users[i].account) === key) return i;
    }
    return -1;
  }

  /**
   * 更新个人资料（昵称 / 性别 / 生日）
   * @returns {{ok:boolean, user?:object}}
   */
  function updateProfile(account, patch) {
    var users = readUsers();
    var index = readIndex(users, account);
    if (index < 0) return { ok: false };

    var user = users[index];
    var fields = ["nickname", "gender", "birthday"];

    fields.forEach(function (field) {
      if (patch[field] !== undefined) {
        user[field] = patch[field];
      }
    });

    /* 兼容旧数据里的 nickname */
    if (!user.nickname && user.username) user.nickname = user.username;

    user.updatedAt = Date.now();
    users[index] = user;
    writeUsers(users);

    /* 同步会话，导航栏上的问候语会立即更新 */
    var session = getSession();
    if (session && normalize(session.account) === normalize(account)) {
      session.username = displayNameOf(user);
      session.gender = user.gender || null;
      global.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    return { ok: true, user: user };
  }

  /* ---------------- 收货地址 ---------------- */

  function listAddresses(account) {
    var users = readUsers();
    var index = readIndex(users, account);
    if (index < 0) return [];
    var list = users[index].addresses;
    return Array.isArray(list) ? list : [];
  }

  function writeAddresses(account, list) {
    var users = readUsers();
    var index = readIndex(users, account);
    if (index < 0) return false;

    /* 只允许一个默认地址 */
    var defIdx = -1;
    list.forEach(function (item, i) {
      if (item.isDefault) {
        if (defIdx === -1) defIdx = i;
        else item.isDefault = false;
      }
    });

    users[index].addresses = list;
    writeUsers(users);
    return true;
  }

  function saveAddress(account, address) {
    var list = listAddresses(account).slice();
    var payload = {
      id: address.id || "addr_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: String(address.name || "").trim(),
      phone: String(address.phone || "").trim(),
      province: address.province || "",
      city: address.city || "",
      district: address.district || "",
      street: String(address.street || "").trim(),
      detail: String(address.detail || "").trim(),
      tag: address.tag || "",
      isDefault: !!address.isDefault,
    };

    var found = -1;
    list.forEach(function (item, i) {
      if (item.id === payload.id) found = i;
    });

    if (found >= 0) list[found] = payload;
    else list.push(payload);

    if (payload.isDefault) {
      list.forEach(function (item) {
        item.isDefault = item.id === payload.id;
      });
    }
    if (!list.some(function (item) { return item.isDefault; }) && list.length) {
      list[0].isDefault = true;
    }

    writeAddresses(account, list);
    return payload;
  }

  function removeAddress(account, id) {
    var list = listAddresses(account).filter(function (item) {
      return item.id !== id;
    });
    if (list.length && !list.some(function (item) { return item.isDefault; })) {
      list[0].isDefault = true;
    }
    writeAddresses(account, list);
    return list;
  }

  /* ---------------- 注册成功后的账号预填 ---------------- */

  function setPrefill(account) {
    try {
      global.sessionStorage.setItem(PREFILL_KEY, account);
    } catch (err) {
      /* 隐私模式下忽略 */
    }
  }

  function takePrefill() {
    try {
      var value = global.sessionStorage.getItem(PREFILL_KEY);
      global.sessionStorage.removeItem(PREFILL_KEY);
      return value || "";
    } catch (err) {
      return "";
    }
  }

  /* ---------------- 暴露 ---------------- */

  global.CShopAuth = {
    DEMO_ACCOUNT: DEMO_ACCOUNT,
    DEMO_PASSWORD: DEMO_PASSWORD,
    seed: seed,
    register: register,
    login: login,
    logout: logout,
    getSession: getSession,
    requireAuth: requireAuth,
    findUser: findUser,
    updateProfile: updateProfile,
    displayNameOf: displayNameOf,
    listAddresses: listAddresses,
    saveAddress: saveAddress,
    removeAddress: removeAddress,
    avatarOf: avatarOf,
    DEFAULT_AVATARS: DEFAULT_AVATARS,
    normalize: normalize,
    isValidPhone: isValidPhone,
    isValidEmail: isValidEmail,
    isValidUsername: isValidUsername,
    isStrongPassword: isStrongPassword,
    setPrefill: setPrefill,
    takePrefill: takePrefill,
  };
})(window);
