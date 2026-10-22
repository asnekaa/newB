class UIEngine {
  constructor() {
    // 核心状态标识与存储键名
    this.nightModeClass = "newb-night-mode";
    this.namespaceClass = "newb-optimized-layout";
    this.storageKeyLayout = "newb_layout_opt";
    this.storageKeyRedirect = "newb_redirect_home";
    this.storageKeyIp = "newb_show_ip";

    // 首页重定向拦截 (最高优先级，同步阻塞执行，彻底杜绝页面闪烁)
    if (
      localStorage.getItem(this.storageKeyRedirect) === "true" &&
      location.hostname === "www.bilibili.com" &&
      (location.pathname === "/" || location.pathname === "/index.html")
    ) {
      location.replace("https://search.bilibili.com");
      return;
    }

    this.currentNightModeConfig = null; // 缓存 Dark♂ 模式配置
    this.systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.dynHotSearchObserver = null; // 动态页热搜兜底观察器
    this.dynHotSearchTimer = null;

    // 监听系统主题变化，实现无缝实时切换
    this.systemThemeQuery.addEventListener("change", (e) => {
      if (
        this.currentNightModeConfig?.enabled &&
        this.currentNightModeConfig?.followSystem
      ) {
        this.applyNightMode(e.matches);
      }
    });

    // 核心机制：同步阻塞执行 (FOUC 防御)
    // 在 DOM 解析阶段立即读取缓存状态并注入深色主题，彻底杜绝页面刷新时的“白屏闪烁”
    if (localStorage.getItem("newb_night_mode_active") === "true") {
      const root = document.documentElement;
      root.setAttribute("data-theme", "dark");
      root.classList.add("dark", "bili_dark");
      localStorage.setItem("theme_style", "dark");

      const linkEl = document.createElement("link");
      linkEl.id = "newb-theme-css";
      linkEl.rel = "stylesheet";
      linkEl.href =
        "https://s1.hdslb.com/bfs/seed/jinkela/short/bili-theme/dark.css";
      (document.head || root).appendChild(linkEl);
    }
  }

  /**
   * 根据最新配置更新 DOM 状态与本地缓存
   * @param {Object} config - 全局配置对象
   */
  update(config) {
    // 1. 配置解构与默认值回退
    const isMasterOn = config.masterSwitch ?? true;
    const uiCfg = config.ui || {};

    const nm = isMasterOn
      ? uiCfg.nightMode || { enabled: false }
      : { enabled: false };
    const isLayoutEnabled = isMasterOn && !!uiCfg.layoutOptimization;
    const isHideHotSearch = isMasterOn && !!uiCfg.hideHotSearch;
    const isHideRecommend = isMasterOn && !!uiCfg.hideRecommend;
    const isRedirectHome = isMasterOn && !!uiCfg.redirectHomeToSearch;
    const isHideHomeFeed = isMasterOn && !!uiCfg.hideHomeFeed;
    const isUserInfoHover = isMasterOn && (uiCfg.userInfoHover ?? true);
    const isIpEnabled = isMasterOn && !!uiCfg.showIpLocation;

    // 2. 跨域/跨页面状态同步 (供 inject 脚本读取)
    localStorage.setItem("newb_master_switch", isMasterOn);
    localStorage.setItem(this.storageKeyLayout, isLayoutEnabled);
    localStorage.setItem(this.storageKeyRedirect, isRedirectHome);
    localStorage.setItem(this.storageKeyIp, isIpEnabled);

    // 异步兜底重定向 (处理首次跨域配置同步时的延迟)
    if (
      isRedirectHome &&
      location.hostname === "www.bilibili.com" &&
      (location.pathname === "/" || location.pathname === "/index.html")
    ) {
      location.replace("https://search.bilibili.com");
      return;
    }

    // 3. 布局优化注入 (规避个人空间页面的样式冲突)
    const root = document.documentElement;
    const isSpacePage = location.hostname === "space.bilibili.com";

    root.classList.toggle(this.namespaceClass, isLayoutEnabled && !isSpacePage);
    root.classList.toggle("newb-layout-common", isLayoutEnabled);
    root.classList.toggle("newb-hide-hot-search", isHideHotSearch);
    root.classList.toggle("newb-hide-recommend", isHideRecommend);
    root.classList.toggle("newb-hide-home-feed", isHideHomeFeed);
    root.classList.toggle("newb-user-info-hover-enabled", isUserInfoHover);

    // 动态页右侧的「bilibili热搜」类名不固定，额外按标题文字兜底隐藏
    this.applyDynamicHotSearch(isHideHotSearch);

    // 4.  Dark♂ 模式调度与主题锁定
    this.currentNightModeConfig = nm;

    let isDarkTime = false;
    if (nm.enabled) {
      isDarkTime = nm.followSystem
        ? this.systemThemeQuery.matches
        : this.isTimeInRange(nm.start, nm.end);
    }

    this.applyNightMode(isDarkTime);
  }

  /**
   * 隐藏动态页右侧的「bilibili热搜」模块
   * B 站该模块的类名会随版本变化，这里按标题文字定位并隐藏整张卡片，
   * 同时避免误伤顶栏搜索面板中的热搜
   * @param {boolean} enabled - 是否启用
   */
  applyDynamicHotSearch(enabled) {
    const MARK = "newb-hide-dyn-hot-search";
    const isDynamicPage =
      location.hostname === "t.bilibili.com" ||
      location.pathname.includes("/dynamic") ||
      location.pathname.startsWith("/opus/");

    const restore = () => {
      document.querySelectorAll(`.${MARK}`).forEach((el) => {
        el.classList.remove(MARK);
      });
    };

    clearTimeout(this.dynHotSearchTimer);

    if (!enabled || !isDynamicPage) {
      restore();
      this.dynHotSearchObserver?.disconnect();
      this.dynHotSearchObserver = null;
      return;
    }

    /**
     * 从热搜标题元素向上寻找整张卡片容器
     */
    const findCard = (el) => {
      let node = el;
      let fallback = null;

      while (node && node !== document.body) {
        const cls = typeof node.className === "string" ? node.className : "";
        const isBoundary =
          node.tagName === "ASIDE" ||
          node.classList.contains("bili-dyn-home--member") ||
          node.classList.contains("right-sidebar-wrap");

        if (node.tagName === "SECTION") return node;
        if (!fallback && /(box|card|panel|module|topic)/i.test(cls)) {
          fallback = node;
        }
        if (isBoundary) break;
        node = node.parentElement;
      }

      return fallback || el.parentElement?.parentElement || el.parentElement;
    };

    /**
     * 确认标题位于页面右半侧，排除顶栏搜索面板
     */
    const isRightSideTitle = (el) => {
      if (
        el.closest(
          "#nav-searchform, .search-panel, .center-search__bar, .bili-header, bili-header",
        )
      ) {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.left > window.innerWidth / 2;
    };

    const hideCard = (titleEl) => {
      if (!titleEl || !isRightSideTitle(titleEl)) return;

      const card = findCard(titleEl);
      if (!card || card.classList.contains(MARK)) return;

      const rect = card.getBoundingClientRect();
      const textLength = (card.textContent || "").length;

      // 防止把整个右栏或页面容器误判为热搜卡片
      if (
        rect.width > 600 ||
        rect.width > window.innerWidth * 0.5 ||
        rect.height > window.innerHeight * 0.95 ||
        textLength > 2000
      ) {
        return;
      }

      card.classList.add(MARK);
    };

    const scan = () => {
      if (!document.body) return;
      if (document.querySelector(`.${MARK}`)?.isConnected) return;

      // 已通过类名规则命中，无需文字兜底
      if (
        document.querySelector(
          ".bili-dyn-topic-box, .bili-dyn-search-trendings",
        )
      ) {
        return;
      }

      if (!document.body.textContent.includes("bilibili热搜")) return;

      let scopes = document.querySelectorAll(
        "aside.right, .right-sidebar-wrap, .bili-dyn-home--member",
      );
      if (!scopes.length) scopes = [document.body];

      scopes.forEach((scope) => {
        const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          const text = (node.nodeValue || "").replace(/\s+/g, "");
          if (!/^bilibili热搜/i.test(text)) continue;
          hideCard(node.parentElement);
        }

        scope
          .querySelectorAll(
            'img[alt*="热搜"], [title*="热搜"], [aria-label*="热搜"]',
          )
          .forEach(hideCard);
      });
    };

    const schedule = () => {
      clearTimeout(this.dynHotSearchTimer);
      this.dynHotSearchTimer = setTimeout(scan, 300);
    };

    scan();

    if (!this.dynHotSearchObserver) {
      this.dynHotSearchObserver = new MutationObserver((mutations) => {
        if (mutations.some((m) => m.addedNodes.length > 0)) schedule();
      });
      this.dynHotSearchObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  }

  /**
   * 应用 Dark♂ 模式状态并锁定主题
   * @param {boolean} isDark - 是否开启深色模式
   */
  applyNightMode(isDark) {
    const root = document.documentElement;
    localStorage.setItem("newb_night_mode_active", isDark);

    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = null;
    }

    if (isDark) {
      root.classList.add(this.nightModeClass);
      this.lockThemeAttribute("dark");
    } else {
      root.classList.remove(this.nightModeClass);
      this.lockThemeAttribute("light");
    }
  }

  /**
   * 强制锁定主题属性 (Theme Lock)
   * 拦截并覆盖 B 站原生 JS 对 `data-theme` 和 `class` 的动态修改
   * @param {'dark'|'light'} themeValue - 目标主题模式
   */
  lockThemeAttribute(themeValue) {
    const root = document.documentElement;
    const isDark = themeValue === "dark";
    const CSS_URLS = {
      dark: "https://s1.hdslb.com/bfs/seed/jinkela/short/bili-theme/dark.css",
      light: "https://s1.hdslb.com/bfs/seed/jinkela/short/bili-theme/light.css",
    };

    /**
     * 核心注入逻辑：确保官方 CSS 文件与 DOM 属性的一致性
     */
    const applyTheme = () => {
      let linkEl = document.getElementById("newb-theme-css");
      const targetCss = isDark ? CSS_URLS.dark : CSS_URLS.light;

      // 动态挂载或更新官方主题样式表
      if (!linkEl) {
        linkEl = document.createElement("link");
        linkEl.id = "newb-theme-css";
        linkEl.rel = "stylesheet";
        linkEl.href = targetCss;
        (document.head || root).appendChild(linkEl);
      } else if (linkEl.href !== targetCss) {
        linkEl.href = targetCss;
      }

      // 强制覆写 DOM 属性
      if (isDark) {
        root.classList.add("bili_dark", "dark");
        root.setAttribute("data-theme", "dark");
        root.style.colorScheme = "dark";
        localStorage.setItem("theme_style", "dark");
      } else {
        root.classList.remove("bili_dark", "dark");
        root.removeAttribute("data-theme");
        root.style.colorScheme = "light";
        localStorage.setItem("theme_style", "light");
      }
    };

    // 首次立即应用
    applyTheme();

    // 建立防篡改观察者 (MutationObserver)
    if (this.themeObserver) this.themeObserver.disconnect();

    this.themeObserver = new MutationObserver(() => {
      // 触发时先断开观察，防止 applyTheme 引发无限递归死循环
      this.themeObserver.disconnect();
      applyTheme();
      // 恢复观察
      this.themeObserver.observe(root, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });
    });

    this.themeObserver.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
  }

  /**
   * 判断当前时间是否在指定的 Dark♂ 模式时段内 (支持跨天计算)
   * @param {string} startStr - 开始时间 (例: "18:00")
   * @param {string} endStr - 结束时间 (例: "06:00")
   * @returns {boolean} 是否处于 Dark♂ 模式时段
   */
  isTimeInRange(startStr, endStr) {
    if (!startStr || !endStr) return false;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [sH, sM] = startStr.split(":").map(Number);
    const [eH, eM] = endStr.split(":").map(Number);

    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;

    // 处理跨天逻辑 (如 18:00 到次日 06:00)
    return startMins < endMins
      ? currentMins >= startMins && currentMins <= endMins
      : currentMins >= startMins || currentMins <= endMins;
  }
}

window.newbUIEngine = new UIEngine();
