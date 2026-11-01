document.addEventListener("DOMContentLoaded", async () => {
  const configManager = window.newbConfigManager;
  let config = await configManager.loadConfig();

  const init = () => {
    chrome.storage.local.remove("blockedLogs");
    renderAll();
    bindEvents();
  };

  const renderAll = () => {
    document.getElementById("master-switch").checked =
      config.masterSwitch ?? true;
    document.getElementById("cleanup-enabled").checked = config.cleanup.enabled;

    const ui = config.ui;
    document.getElementById("ui-layout-opt").checked = ui.layoutOptimization;
    document.getElementById("ui-hide-hot-search").checked =
      ui.hideHotSearch ?? false;
    document.getElementById("ui-hide-recommend").checked =
      ui.hideRecommend ?? false;
    document.getElementById("ui-redirect-home").checked =
      ui.redirectHomeToSearch ?? false;
    document.getElementById("ui-hide-home-feed").checked =
      ui.hideHomeFeed ?? false;
    document.getElementById("ui-video-info-hover").checked =
      ui.videoInfoHover ?? true;
    document.getElementById("ui-video-info-hover-ai").checked =
      ui.videoInfoHoverAi ?? true;
    document.getElementById("ui-video-info-hover-reply").checked =
      ui.videoInfoHoverReply ?? true;
    document.getElementById("ui-user-info-hover").checked =
      ui.userInfoHover ?? true;
    document.getElementById("ui-video-info-delay").value =
      ui.infoHoverDelay ?? 500;
    document.getElementById("ui-show-ip").checked = ui.showIpLocation;
    document.getElementById("ui-show-cover-viewer").checked =
      ui.showCoverViewer ?? false;
    document.getElementById("ui-hao-van-de").checked = ui.haoVanDe ?? false;

    document.getElementById("app-version").textContent = `v${chrome.runtime.getManifest().version}`;

    const nm = ui.darkMode || {
      enabled: true,
      followSystem: true,
      start: "18:00",
      end: "06:00",
    };

    let mode = nm.mode;
    if (!mode) {
      if (!nm.enabled) mode = "off";
      else if (nm.followSystem) mode = "system";
      else if (nm.start === "00:00" && nm.end === "23:59") mode = "on";
      else mode = "custom";
    }
    document.getElementById("ui-dark-mode-select").value = mode;
    document.getElementById("ui-dark-start").value = nm.start;
    document.getElementById("ui-dark-end").value = nm.end;

    const timeRangeEl = document.getElementById("dark-time-range");
    if (mode === "custom") {
      timeRangeEl.style.maxHeight = "40px";
      timeRangeEl.style.opacity = "1";
      timeRangeEl.style.marginTop = "8px";
      timeRangeEl.style.pointerEvents = "auto";
    } else {
      timeRangeEl.style.maxHeight = "0";
      timeRangeEl.style.opacity = "0";
      timeRangeEl.style.marginTop = "0";
      timeRangeEl.style.pointerEvents = "none";
    }

    const videoHoverEnabled = ui.videoInfoHover ?? true;
    const subPanel = document.getElementById("video-hover-sub-panel");
    if (videoHoverEnabled) {
      subPanel.style.maxHeight = "150px";
      subPanel.style.opacity = "1";
      subPanel.style.marginTop = "10px";
      subPanel.style.pointerEvents = "auto";
    } else {
      subPanel.style.maxHeight = "0";
      subPanel.style.opacity = "0";
      subPanel.style.marginTop = "0";
      subPanel.style.pointerEvents = "none";
    }

    const isTimeInRange = (startStr, endStr) => {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const [sH, sM] = startStr.split(":").map(Number);
      const [eH, eM] = endStr.split(":").map(Number);
      const startMins = sH * 60 + sM;
      const endMins = eH * 60 + eM;
      return startMins < endMins
        ? currentMins >= startMins && currentMins <= endMins
        : currentMins >= startMins || currentMins <= endMins;
    };

    const isSystemDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    let isDarkTime = false;
    if (mode === "on") isDarkTime = true;
    else if (mode === "system") isDarkTime = isSystemDark;
    else if (mode === "custom") isDarkTime = isTimeInRange(nm.start, nm.end);

    document.body.classList.toggle("dark-mode", mode !== "off" && isDarkTime);
  };

  const saveAndRefresh = async () => {
    const getVal = (id) => {
      if (id === "ui-hao-van-de" || id === "master-switch") {
        const el = document.getElementById(id);
        return el ? el.checked : false;
      }
      const mappedId =
        config.ui.haoVanDe && config.ui.haoVanDeMap
          ? config.ui.haoVanDeMap[id] || id
          : id;
      const el = document.getElementById(mappedId);
      return el ? el.checked : false;
    };

    config.masterSwitch = document.getElementById("master-switch").checked;
    config.ui.infoHoverDelay =
      parseInt(document.getElementById("ui-video-info-delay").value) || 500;

    config.cleanup.enabled = getVal("cleanup-enabled");

    config.ui.layoutOptimization = getVal("ui-layout-opt");
    config.ui.hideHotSearch = getVal("ui-hide-hot-search");
    config.ui.hideRecommend = getVal("ui-hide-recommend");
    config.ui.redirectHomeToSearch = getVal("ui-redirect-home");
    config.ui.hideHomeFeed = getVal("ui-hide-home-feed");
    config.ui.videoInfoHover = getVal("ui-video-info-hover");
    config.ui.videoInfoHoverAi = getVal("ui-video-info-hover-ai");
    config.ui.videoInfoHoverReply = getVal("ui-video-info-hover-reply");
    config.ui.userInfoHover = getVal("ui-user-info-hover");
    config.ui.showIpLocation = getVal("ui-show-ip");
    config.ui.showCoverViewer = getVal("ui-show-cover-viewer");
    config.ui.haoVanDe = getVal("ui-hao-van-de");

    const darkModeSelect = document.getElementById(
      "ui-dark-mode-select",
    ).value;
    config.ui.darkMode = {
      mode: darkModeSelect,
      enabled: darkModeSelect !== "off",
      followSystem: darkModeSelect === "system",
      start:
        darkModeSelect === "on"
          ? "00:00"
          : document.getElementById("ui-dark-start").value,
      end:
        darkModeSelect === "on"
          ? "23:59"
          : document.getElementById("ui-dark-end").value,
    };

    await configManager.saveLocal(config);
    renderAll();
  };

  const bindEvents = () => {
    const inputs = [
      "master-switch",
      "cleanup-enabled",
      "ui-dark-mode-select",
      "ui-dark-start",
      "ui-dark-end",
      "ui-layout-opt",
      "ui-hide-hot-search",
      "ui-hide-recommend",
      "ui-redirect-home",
      "ui-hide-home-feed",
      "ui-video-info-hover",
      "ui-video-info-hover-ai",
      "ui-video-info-hover-reply",
      "ui-user-info-hover",
      "ui-video-info-delay",
      "ui-show-ip",
      "ui-show-cover-viewer",
    ];
    inputs.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("change", saveAndRefresh);
    });

    document
      .getElementById("btn-upload")
      .addEventListener("click", async (e) => {
        const btn = e.target;
        btn.innerText = "正在备份...";
        const res = await configManager.uploadToCloud();
        document.getElementById("sync-status").innerText = res.success
          ? `备份成功! 版本:${res.version}`
          : `失败: ${res.error}`;
        btn.innerText = "备份当前配置到云端 ↑";
      });

    document
      .getElementById("btn-download")
      .addEventListener("click", async () => {
        if (!confirm("确定要从云端恢复吗？当前本地配置将被覆盖。")) return;
        const res = await configManager.downloadFromCloud();
        if (res.success) {
          config = res.config;
          renderAll();
          alert("恢复成功！");
        } else {
          alert(res.error);
        }
      });

    document
      .getElementById("btn-export")
      .addEventListener("click", () => configManager.exportJSON(config));

    const fileInput = document.getElementById("file-import");
    document
      .getElementById("btn-import-trigger")
      .addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        config = await configManager.importJSON(file);
        renderAll();
        alert("导入成功！");
      } catch (err) {
        alert(err.message || "导入失败");
      } finally {
        fileInput.value = "";
      }
    });

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (config.ui?.darkMode?.followSystem) renderAll();
      });

    const haoVanDeToggle = document.getElementById("ui-hao-van-de");
    const haoVanDeModal = document.getElementById("hao-van-de-modal");

    const switchIds = [
      "cleanup-enabled",
      "ui-layout-opt",
      "ui-hide-hot-search",
      "ui-hide-recommend",
      "ui-redirect-home",
      "ui-hide-home-feed",
      "ui-video-info-hover",
      "ui-video-info-hover-ai",
      "ui-video-info-hover-reply",
      "ui-user-info-hover",
      "ui-show-ip",
      "ui-show-cover-viewer",
    ];

    const shuffleArray = (array) => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const generateMap = () => {
      const map = {};
      const shuffled = shuffleArray(switchIds);
      switchIds.forEach((id, index) => (map[id] = shuffled[index]));
      return map;
    };

    if (haoVanDeToggle) {
      haoVanDeToggle.addEventListener("change", (e) => {
        if (e.target.checked) {
          e.target.checked = false;
          haoVanDeModal.classList.add("show");
        } else {
          config.ui.haoVanDe = false;
          config.ui.haoVanDeMap = null;
          saveAndRefresh();
        }
      });
    }

    document
      .getElementById("modal-btn-cancel")
      ?.addEventListener("click", () => {
        haoVanDeModal.classList.remove("show");
      });

    document
      .getElementById("modal-btn-export")
      ?.addEventListener("click", () => {
        configManager.exportJSON(config);
      });

    document
      .getElementById("modal-btn-confirm")
      ?.addEventListener("click", async () => {
        haoVanDeModal.classList.remove("show");
        config.ui.haoVanDe = true;
        config.ui.haoVanDeMap = generateMap();
        haoVanDeToggle.checked = true;
        await configManager.saveLocal(config);
        renderAll();
      });
  };

  init();
});
