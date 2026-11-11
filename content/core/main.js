(function () {
  let activeConfig = null;

  const getContext = () => {
    const path = location.pathname;
    const host = location.hostname;
    const isHome =
      ["/", "/index.html"].includes(path) ||
      (host === "www.bilibili.com" && path === "/");
    const isPlay = path.startsWith("/video/") || path.startsWith("/list/");
    return { shouldRunCleanup: isHome || isPlay };
  };

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

  const bootstrap = async () => {
    activeConfig = await window.newbConfigManager.loadConfig();

    window.newbUIEngine?.update(activeConfig);

    setInterval(async () => {
      if (document.hidden) return;
      activeConfig = await window.newbConfigManager.loadConfig();
      window.newbUIEngine?.update(activeConfig);
    }, 60000);

    applyCleanup(activeConfig);
    window.newbVideoInfoHover?.updateConfig(activeConfig);
    window.newbVideoPreview?.updateConfig(activeConfig);
    window.newbUserInfoHover?.updateConfig(activeConfig);
    window.newbCoverViewer?.updateConfig(activeConfig);
  };

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.newb_settings_v1) return;

    const newConfig = changes.newb_settings_v1.newValue;
    if (!newConfig) return;

    activeConfig = newConfig;

    window.newbUIEngine?.update(activeConfig);
    window.newbVideoInfoHover?.updateConfig(activeConfig);
    window.newbVideoPreview?.updateConfig(activeConfig);
    window.newbUserInfoHover?.updateConfig(activeConfig);
    window.newbCoverViewer?.updateConfig(activeConfig);

    applyCleanup(activeConfig);
  });

  window.newbConfigManager
    .loadConfig()
    .then((cfg) => window.newbUIEngine?.update(cfg));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
