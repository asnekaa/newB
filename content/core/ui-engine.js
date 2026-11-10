class UIEngine {
  constructor() {
    this.darkModeClass = "newb-dark-mode";
    this.namespaceClass = "newb-optimized-layout";
    this.storageKeyLayout = "newb_layout_opt";
    this.storageKeyRedirect = "newb_redirect_home";
    this.storageKeyIp = "newb_show_ip";

    if (
      localStorage.getItem(this.storageKeyRedirect) === "true" &&
      location.hostname === "www.bilibili.com" &&
      (location.pathname === "/" || location.pathname === "/index.html")
    ) {
      location.replace("https://search.bilibili.com");
      return;
    }

    this.currentDarkModeConfig = null;
    this.systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.dynHotSearchObserver = null;
    this.dynHotSearchTimer = null;

    this.systemThemeQuery.addEventListener("change", (e) => {
      if (
        this.currentDarkModeConfig?.enabled &&
        this.currentDarkModeConfig?.followSystem
      ) {
        this.applyDarkMode(e.matches);
      }
    });

    if (
      localStorage.getItem("newb_dark_mode_active") === "true" ||
      localStorage.getItem("newb_night_mode_active") === "true"
    ) {
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

  update(config) {
    const isMasterOn = config.masterSwitch ?? true;
    const uiCfg = config.ui || {};

    const nm = isMasterOn
      ? uiCfg.darkMode || { enabled: false }
      : { enabled: false };
    const isLayoutEnabled = isMasterOn && !!uiCfg.layoutOptimization;
    const isHideHotSearch = isMasterOn && !!uiCfg.hideHotSearch;
    const isHideRecommend = isMasterOn && !!uiCfg.hideRecommend;
    const isRedirectHome = isMasterOn && !!uiCfg.redirectHomeToSearch;
    const isHideHomeFeed = isMasterOn && !!uiCfg.hideHomeFeed;
    const isDynamicPage =
      location.hostname === "t.bilibili.com" ||
      location.pathname.startsWith("/v/dynamic") ||
      location.pathname.startsWith("/dynamic") ||
      location.pathname.startsWith("/opus/");
    const isUserInfoHover =
      isMasterOn && (uiCfg.userInfoHover ?? true) && !isDynamicPage;
    const isIpEnabled = isMasterOn && !!uiCfg.showIpLocation;

    localStorage.setItem("newb_master_switch", isMasterOn);
    localStorage.setItem(this.storageKeyLayout, isLayoutEnabled);
    localStorage.setItem(this.storageKeyRedirect, isRedirectHome);
    localStorage.setItem(this.storageKeyIp, isIpEnabled);

    if (
      isRedirectHome &&
      location.hostname === "www.bilibili.com" &&
      (location.pathname === "/" || location.pathname === "/index.html")
    ) {
      location.replace("https://search.bilibili.com");
      return;
    }

    const root = document.documentElement;
    const isSpacePage = location.hostname === "space.bilibili.com";

    root.classList.toggle(this.namespaceClass, isLayoutEnabled && !isSpacePage);
    root.classList.toggle("newb-layout-common", isLayoutEnabled);
    root.classList.toggle("newb-hide-hot-search", isHideHotSearch);
    root.classList.toggle("newb-hide-recommend", isHideRecommend);
    root.classList.toggle("newb-hide-home-feed", isHideHomeFeed);
    root.classList.toggle("newb-user-info-hover-enabled", isUserInfoHover);

    this.applyDynamicHotSearch(isHideHotSearch);

    this.currentDarkModeConfig = nm;

    let isDarkTime = false;
    if (nm.enabled) {
      isDarkTime = nm.followSystem
        ? this.systemThemeQuery.matches
        : this.isTimeInRange(nm.start, nm.end);
    }

    this.applyDarkMode(isDarkTime);
  }

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

  applyDarkMode(isDark) {
    const root = document.documentElement;
    localStorage.setItem("newb_dark_mode_active", isDark);

    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = null;
    }

    if (isDark) {
      root.classList.add(this.darkModeClass);
      this.lockThemeAttribute("dark");
    } else {
      root.classList.remove(this.darkModeClass);
      this.lockThemeAttribute("light");
    }
  }

  lockThemeAttribute(themeValue) {
    const root = document.documentElement;
    const isDark = themeValue === "dark";
    const CSS_URLS = {
      dark: "https://s1.hdslb.com/bfs/seed/jinkela/short/bili-theme/dark.css",
      light: "https://s1.hdslb.com/bfs/seed/jinkela/short/bili-theme/light.css",
    };

    const applyTheme = () => {
      let linkEl = document.getElementById("newb-theme-css");
      const targetCss = isDark ? CSS_URLS.dark : CSS_URLS.light;

      if (!linkEl) {
        linkEl = document.createElement("link");
        linkEl.id = "newb-theme-css";
        linkEl.rel = "stylesheet";
        linkEl.href = targetCss;
        (document.head || root).appendChild(linkEl);
      } else if (linkEl.href !== targetCss) {
        linkEl.href = targetCss;
      }

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

    applyTheme();

    if (this.themeObserver) this.themeObserver.disconnect();

    this.themeObserver = new MutationObserver(() => {
      this.themeObserver.disconnect();
      applyTheme();
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

  isTimeInRange(startStr, endStr) {
    if (!startStr || !endStr) return false;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [sH, sM] = startStr.split(":").map(Number);
    const [eH, eM] = endStr.split(":").map(Number);

    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;

    return startMins < endMins
      ? currentMins >= startMins && currentMins <= endMins
      : currentMins >= startMins || currentMins <= endMins;
  }
}

window.newbUIEngine = new UIEngine();
