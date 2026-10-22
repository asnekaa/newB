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

  /**
   * 深度合并配置：只保留默认配置中存在的键，避免旧版/损坏配置污染运行时
   * @param {Object} base - 默认配置
   * @param {Object} target - 待合并配置
   * @returns {Object} 合并后的配置
   */
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

  /**
   * 将任意配置对象规范化为完整的默认配置结构
   * @param {Object} config - 待规范化的配置
   * @returns {Object} 完整配置
   */
  normalizeConfig(config) {
    const defaults = JSON.parse(JSON.stringify(this.defaultConfig));

    if (!config || typeof config !== "object" || Array.isArray(config)) {
      return defaults;
    }

    const merged = this.mergeConfig(defaults, config);
    merged.version = config.version || defaults.version;
    return merged;
  }

  /**
   * 加载本地配置并与默认配置进行深度合并
   * @returns {Promise<Object>} 合并后的完整配置对象
   */
  async loadConfig() {
    const res = await chrome.storage.local.get(this.configKey);
    return this.normalizeConfig(res[this.configKey]);
  }

  /**
   * 保存配置到本地存储，并更新版本时间戳
   * @param {Object} config - 待保存的配置对象
   * @returns {Promise<Object>} 保存后的配置对象
   */
  async saveLocal(config) {
    config.version = Date.now();
    await chrome.storage.local.set({ [this.configKey]: config });
    return config;
  }

  /**
   * 将本地配置备份至 Chrome 云端同步空间
   * @returns {Promise<Object>} 包含 success 状态和 version/error 信息的对象
   */
  async uploadToCloud() {
    try {
      const localConfig = await this.loadConfig();
      await chrome.storage.sync.set({ [this.cloudKey]: localConfig });
      return { success: true, version: localConfig.version };
    } catch (e) {
      return { success: false, error: "数据过大或网络异常，同步失败" };
    }
  }

  /**
   * 从 Chrome 云端恢复配置到本地
   * @returns {Promise<Object>} 包含 success 状态和 config/error 信息的对象
   */
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

  /**
   * 导出配置为 JSON 文件供用户下载
   * @param {Object} config - 当前配置对象
   */
  exportJSON(config) {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `newB_config_${Date.now()}.json`;
    a.click();

    // 延迟释放，避免部分浏览器在下载开始前就取消 Blob URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * 解析用户上传的 JSON 文件并覆盖本地配置
   * @param {File} file - 用户选择的 JSON 文件
   * @returns {Promise<Object>} 解析并保存后的配置对象
   */
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
