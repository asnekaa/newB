class CleanupEngine {
  constructor() {
    this.observer = null;

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
    this.staticBlacklistSelector = this.staticBlacklist.join(",");
  }

  detectCategory(card) {
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
    if (!videoUrl) {
      const adNode = card.querySelector("[data-target-url], [data-url]");
      videoUrl = adNode?.dataset?.targetUrl || adNode?.dataset?.url || "";
    }

    if (videoUrl.includes("cheese.bilibili.com") || videoUrl.includes("/cheese/"))
      return "课程";
    if (
      card.classList.contains("bili-live-card") ||
      card.querySelector(".bili-live-card__info--living__icon") ||
      card.querySelector(".pop-live-small-mode") ||
      videoUrl.includes("live.bilibili.com")
    )
      return "直播";
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

  run(config) {
    this.stop();
    if (!config.cleanup?.enabled) return;

    const scan = () => {
      document.querySelectorAll(this.staticBlacklistSelector).forEach((el) => {
        const card =
          el.closest(
            ".feed-card, .bili-feed-card, .video-card, .video-page-card-small",
          ) || el;
        if (card.style.display !== "none") {
          card.style.display = "none";
          card.dataset.newbProcessed = "true";
        }
      });

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

    scan();
    setTimeout(scan, 500);
    setTimeout(scan, 2000);

    this.observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.addedNodes.length > 0)) {
        window.requestIdleCallback ? window.requestIdleCallback(scan) : scan();
      }
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

window.newbCleanup = new CleanupEngine();
