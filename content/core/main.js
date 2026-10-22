(function () {
  let activeConfig = null; // 维护全局最新配置状态

  /**
   * 解析当前页面路由上下文 (净化引擎仅在首页与视频页生效)
   */
  const getContext = () => {
    const path = location.pathname;
    const host = location.hostname;
    const isHome =
      ["/", "/index.html"].includes(path) ||
      (host === "www.bilibili.com" && path === "/");
    const isPlay = path.startsWith("/video/") || path.startsWith("/list/");
    return { shouldRunCleanup: isHome || isPlay };
  };

  /**
   * 恢复被净化引擎隐藏的卡片，以便配置变更后重新判定
   */
  const restoreProcessedCards = () => {
    document.querySelectorAll('[data-newb-processed="true"]').forEach((el) => {
      el.dataset.newbProcessed = "false";
      const outer =
        el.closest(
          ".feed-card, .bili-feed-card, .video-card, .video-page-card-small",
        ) || el;
      outer.style.display = "";
    });
  };

  /**
   * 根据当前配置启动或停止页面净化
   */
  const applyCleanup = (config) => {
    const { shouldRunCleanup } = getContext();
    if (!shouldRunCleanup) return;

    restoreProcessedCards();

    if (config.masterSwitch === false) {
      window.newbCleanup?.stop();
      return;
    }

    window.newbCleanup?.run(config);
  };

  /**
   * 系统启动引导程序
   */
  const bootstrap = async () => {
    activeConfig = await window.newbConfigManager.loadConfig();

    // 1. 初始化 UI 引擎 (同步执行以防页面闪烁)
    window.newbUIEngine?.update(activeConfig);

    // 2. 定时轮询 Dark♂ 模式状态 (每分钟检查一次时间区间)
    setInterval(async () => {
      if (document.hidden) return; // 后台标签页无需刷新
      activeConfig = await window.newbConfigManager.loadConfig();
      window.newbUIEngine?.update(activeConfig);
    }, 60000);

    // 3. 按需初始化业务模块
    applyCleanup(activeConfig);
    window.newbVideoInfoHover?.updateConfig(activeConfig);
    window.newbUserInfoHover?.updateConfig(activeConfig);
    window.newbCoverViewer?.updateConfig(activeConfig);
  };

  /**
   * 配置热更新监听 (无需刷新页面即刻生效)
   */
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.newb_settings_v1) return;

    const newConfig = changes.newb_settings_v1.newValue;
    if (!newConfig) return;

    activeConfig = newConfig; // 更新全局配置引用

    // 更新各独立模块配置
    window.newbUIEngine?.update(activeConfig);
    window.newbVideoInfoHover?.updateConfig(activeConfig);
    window.newbUserInfoHover?.updateConfig(activeConfig);
    window.newbCoverViewer?.updateConfig(activeConfig);

    // 状态重置后按新配置重新执行页面净化
    applyCleanup(activeConfig);
  });

  // 优先利用缓存配置极速初始化 UI，防止深色模式闪屏
  window.newbConfigManager
    .loadConfig()
    .then((cfg) => window.newbUIEngine?.update(cfg));

  // 确保在 DOM 准备就绪后挂载核心逻辑
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
