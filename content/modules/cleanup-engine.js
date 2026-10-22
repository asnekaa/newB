class CleanupEngine {
  constructor() {
    this.observer = null;

    // 静态特征黑名单：直接命中这些选择器的元素将被无条件移除
    this.staticBlacklist = [
      ".pop-live-small-mode",
      ".floor-single-card",
      ".bili-live-card",
      ".ad-report",
      ".bili-video-card__info--ad",
      ".bili-video-card__info--creative-ad",
      "#bannerAd",
      "#slide_ad",
      "#right-bottom-banner",
      ".video-card-ad-small",
      ".video-page-game-card-small",
      ".ad-floor-exp",
      ".desktop-download-tip",
    ];
    // 合并为单个选择器，避免每次扫描执行十几次 querySelectorAll
    this.staticBlacklistSelector = this.staticBlacklist.join(",");
  }

  /**
   * 识别卡片的内容分类 (用于判断伪装成普通视频的广告/直播)
   * @param {HTMLElement} card - 视频/推广卡片 DOM 节点
   * @returns {string} 命中时返回分类名称，普通视频返回空字符串
   */
  detectCategory(card) {
    // 1. 基于角标文本推断
    const badges = card.querySelectorAll(
      ".bili-video-card__info--ad, .bili-video-card__info--badge, .bili-live-card__info--badge, .v-img, span, div",
    );

    for (const b of badges) {
      const txt = b.textContent.trim();
      if (["广告", "🔥广告", "优质推广", "赞助"].includes(txt)) return "广告";
      if (["直播", "正在直播"].includes(txt)) return "直播";
      if (["番剧", "国创", "电影", "纪录片", "电视剧", "综艺"].includes(txt)) {
        return txt;
      }
      if (txt.includes("课程") || txt.includes("课堂")) return "课程";
    }

    // 2. 收集卡片内的有效跳转链接 (排除 javascript: 伪链接与 UP 主主页)
    let videoUrl = "";
    for (const a of card.querySelectorAll("a")) {
      if (
        a.href &&
        !a.href.startsWith("javascript:") &&
        !a.href.includes("space.bilibili.com")
      ) {
        videoUrl = a.href;
        break;
      }
    }
    // 部分特殊广告可能把链接写在 data 属性里
    if (!videoUrl) {
      const adNode = card.querySelector("[data-target-url], [data-url]");
      videoUrl = adNode?.dataset?.targetUrl || adNode?.dataset?.url || "";
    }

    // 3. 基于 URL 或 DOM 结构特征推断 (兜底策略)
    if (videoUrl.includes("cheese.bilibili.com") || videoUrl.includes("/cheese/"))
      return "课程";
    if (
      card.classList.contains("bili-live-card") ||
      card.querySelector(".bili-live-card__info--living__icon") ||
      card.querySelector(".pop-live-small-mode") ||
      videoUrl.includes("live.bilibili.com")
    )
      return "直播";
    // 识别特定的广告 SVG 图标
    if (card.querySelector("svg.vui_icon")?.innerHTML.includes("M13.5"))
      return "广告";
    if (
      card.querySelector(
        ".ad-report, .video-card-ad-small, #bannerAd, .ad-floor-exp",
      )
    )
      return "广告";
    if (
      card.classList.contains("floor-single-card") ||
      card.id === "right-bottom-banner"
    )
      return "活动推广";

    return "";
  }

  /**
   * 执行页面净化扫描
   * @param {Object} config - 全局配置对象
   */
  run(config) {
    this.stop();
    if (!config.cleanup?.enabled) return;

    /**
     * 核心扫描逻辑：遍历并隐藏违规卡片
     */
    const scan = () => {
      // 1. 静态黑名单扫描
      document.querySelectorAll(this.staticBlacklistSelector).forEach((el) => {
        // 向上寻找最外层卡片容器
        const card =
          el.closest(
            ".feed-card, .bili-feed-card, .video-card, .video-page-card-small",
          ) || el;
        if (card.style.display !== "none") {
          card.style.display = "none";
          card.dataset.newbProcessed = "true";
        }
      });

      // 2. 动态卡片扫描 (识别伪装成普通视频的广告/直播)
      document
        .querySelectorAll(".bili-video-card, .feed-card, .video-card")
        .forEach((card) => {
          if (
            card.style.display === "none" ||
            card.dataset.newbProcessed === "true"
          )
            return;

          if (this.detectCategory(card)) {
            card.style.display = "none";
            card.dataset.newbProcessed = "true";
          }
        });
    };

    // 初始多频次扫描，应对 B 站首屏分段渲染机制
    scan();
    setTimeout(scan, 500);
    setTimeout(scan, 2000);

    // 建立 DOM 监听，处理滚动加载的新卡片
    this.observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.addedNodes.length > 0)) {
        // 利用 requestIdleCallback 在浏览器空闲时执行，避免引起页面滚动卡顿
        window.requestIdleCallback ? window.requestIdleCallback(scan) : scan();
      }
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * 停止净化引擎并断开 DOM 监听
   */
  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

window.newbCleanup = new CleanupEngine();
