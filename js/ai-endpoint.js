(function () {
  var host = window.location.hostname;
  var isLocal = !host || host === "127.0.0.1" || host === "localhost";

  if (!isLocal) {
    // 临时 Cloudflare 隧道；cloudflared 重启后地址会变，需要同步更新并重新发布。
    window.CSHOP_AI_ENDPOINT = "https://operate-desired-investor-being.trycloudflare.com";
  }
})();
