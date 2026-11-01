class ConfigManager {
  constructor() {
    this.configKey = "newb_settings_v1";
    this.cloudKey = "newb_cloud_sync";

    this.defaultConfig = {
      version: Date.now(),
      masterSwitch: true,
      cleanup: {
        enabled: true,
        hideLive: true,
        hideAds: true,
      },
      ui: {
        nightMode: {
          enabled: true,
          followSystem: true,
          start: "18:30",
          end: "06:00",
        },
        layoutOptimization: true,
        hideHotSearch: true,
        hideRecommend: false,
        redirectHomeToSearch: false,
        hideHomeFeed: false,
        videoInfoHover: true,
        videoInfoHoverAi: true,
        videoInfoHoverReply: true,
        userInfoHover: true,
        infoHoverDelay: 500,
        showIpLocation: false,
        showCoverViewer: false,
        haoVanDe: false,
        haoVanDeMap: null,
      },
    };
  }

  mergeConfig(base, target) {
    if (!target || typeof target !== "object" || Array.isArray(target)) {
      return base;
    }

    const result = { ...base };

    for (const key of Object.keys(target)) {
      if (!Object.prototype.hasOwnProperty.call(base, key)) continue;

      const baseValue = base[key];
      const targetValue = target[key];
      const bothPlainObjects =
        baseValue &&
        typeof baseValue === "object" &&
        !Array.isArray(baseValue) &&
        targetValue &&
        typeof targetValue === "object" &&
        !Array.isArray(targetValue);

      result[key] = bothPlainObjects
        ? this.mergeConfig(baseValue, targetValue)
        : targetValue;
    }

    return result;
  }

  normalizeConfig(config) {
    const defaults = JSON.parse(JSON.stringify(this.defaultConfig));

    if (!config || typeof config !== "object" || Array.isArray(config)) {
      return defaults;
    }

    const merged = this.mergeConfig(defaults, config);
    merged.version = config.version || defaults.version;
    return merged;
  }

  async loadConfig() {
    const res = await chrome.storage.local.get(this.configKey);
    return this.normalizeConfig(res[this.configKey]);
  }

  async saveLocal(config) {
    config.version = Date.now();
    await chrome.storage.local.set({ [this.configKey]: config });
    return config;
  }

  async uploadToCloud() {
    try {
      const localConfig = await this.loadConfig();
      await chrome.storage.sync.set({ [this.cloudKey]: localConfig });
      return { success: true, version: localConfig.version };
    } catch (e) {
      return { success: false, error: "数据过大或网络异常，同步失败" };
    }
  }

  async downloadFromCloud() {
    try {
      const res = await chrome.storage.sync.get(this.cloudKey);
      const cloudConfig = res[this.cloudKey];

      if (cloudConfig) {
        const config = this.normalizeConfig(cloudConfig);
        await chrome.storage.local.set({ [this.configKey]: config });
        return { success: true, config };
      }
      return { success: false, error: "云端未找到备份数据" };
    } catch (e) {
      return { success: false, error: "读取云端数据失败" };
    }
  }

  exportJSON(config) {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `newB_config_${Date.now()}.json`;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const raw = JSON.parse(e.target.result);
          if (typeof raw !== "object" || !raw) {
            throw new Error("Invalid Format");
          }

          const config = this.normalizeConfig(raw);
          await this.saveLocal(config);
          resolve(config);
        } catch (err) {
          reject(new Error("无效的配置文件，解析失败"));
        }
      };

      reader.onerror = () => reject(new Error("文件读取失败"));
      reader.readAsText(file);
    });
  }
}

window.newbConfigManager = new ConfigManager();
