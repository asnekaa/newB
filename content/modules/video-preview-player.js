class VideoPreviewPlayer {
  constructor() {
    this.panel = null;
    this.video = null;
    this.danmakuLayer = null;
    this.titleEl = null;
    this.tipEl = null;
    this.hideTimer = null;
    this.dmTimer = null;
    this.dmList = [];
    this.dmIndex = 0;
    this.dmCid = null;
    this.dmCache = new Map();
    this.currentBvid = null;
    this.currentAnchor = null;
    this.userPosition = null;
    this.userWidth = null;
    this.dragState = null;
    this.resizeState = null;
    this.config = { enabled: true };
    this.dmSettings = this.readDanmakuSettings();
  }

  readDanmakuSettings() {
    const settings = {
      enabled: true,
      opacity: 0.9,
      fontScale: 1,
      speed: 1,
      area: 100,
      blockColor: false,
      blockScroll: false,
    };

    try {
      const profile = JSON.parse(
        localStorage.getItem("bpx_player_profile") || "null",
      );
      const dm = profile?.dmSetting;

      if (dm && typeof dm === "object") {
        const clamp = (value, min, max) =>
          Math.min(max, Math.max(min, Number(value) || min));
        const area = Number(dm.dmarea);
        const areaPct = [25, 50, 75].includes(area) ? area : 100;

        return {
          enabled: dm.dmSwitch !== false && dm.typeScroll !== false,
          opacity: clamp(dm.opacity, 0.05, 1),
          fontScale: clamp(dm.fontsize, 0.4, 1.6),
          speed: clamp(dm.speedplus, 0.4, 1.6),
          area: areaPct,
          blockColor: dm.typeColor === false,
          blockScroll: dm.typeScroll === false,
          bold: dm.bold === true,
        };
      }
    } catch {}

    const flat = new Map();

    const walk = (value, depth) => {
      if (!value || typeof value !== "object" || depth > 4) return;

      for (const [key, item] of Object.entries(value)) {
        if (item && typeof item === "object") walk(item, depth + 1);
        else flat.set(key, item);
      }
    };

    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!/player|danmaku|dm|profile/i.test(key)) continue;

        const raw = localStorage.getItem(key);
        if (!raw || !raw.trim().startsWith("{")) continue;

        walk(JSON.parse(raw), 0);
      }
    } catch {}

    const pick = (...names) => {
      for (const name of names) {
        if (flat.has(name)) {
          const value = flat.get(name);
          if (value !== null && value !== undefined) return value;
        }
      }
      return undefined;
    };

    const enabled = pick("dm_switch", "dmSwitch", "danmakuSwitch", "danmakuEnabled");
    if (typeof enabled === "boolean") settings.enabled = enabled;

    const opacity = Number(pick("opacity", "dmOpacity", "danmakuOpacity"));
    if (Number.isFinite(opacity) && opacity > 0 && opacity <= 1) settings.opacity = opacity;

    const fontsize = Number(pick("fontsize", "fontSize", "dmFontSize", "danmakuFontSize"));
    if (Number.isFinite(fontsize) && fontsize >= 0.4 && fontsize <= 2) settings.fontScale = fontsize;

    const speed = Number(pick("speedplus", "speedPlus", "dmSpeed", "danmakuSpeed"));
    if (Number.isFinite(speed) && speed >= 0.3 && speed <= 2) settings.speed = speed;

    const area = Number(pick("dmarea", "dmArea", "danmakuArea"));
    if (Number.isFinite(area) && area >= 0 && area <= 100) settings.area = area;

    const blockColor = pick("blockcolor", "blockColor");
    if (typeof blockColor === "boolean") settings.blockColor = !blockColor;

    const blockScroll = pick("blockscroll", "blockScroll");
    if (typeof blockScroll === "boolean") settings.blockScroll = !blockScroll;

    return settings;
  }

  updateConfig(config) {
    const isMasterOn = config.masterSwitch ?? true;
    this.config.enabled =
      isMasterOn &&
      (config.ui?.videoInfoHover ?? true) &&
      (config.ui?.videoInfoHoverPreview ?? true);

    if (!this.config.enabled) this.close();
  }

  isOpen() {
    return Boolean(this.panel?.classList.contains("show"));
  }

  isHovered() {
    return Boolean(this.panel?.matches?.(":hover"));
  }

  ensurePanel() {
    if (this.panel) return;

    const panel = document.createElement("div");
    panel.id = "newb-preview-player";
    panel.innerHTML = `
      <div class="newb-preview-head">
        <span class="newb-preview-title"></span>
        <button class="newb-preview-close" type="button" aria-label="关闭">×</button>
      </div>
      <div class="newb-preview-stage">
        <video class="newb-preview-video" controls playsinline preload="none"></video>
        <div class="newb-preview-danmaku"></div>
      </div>
      <div class="newb-preview-tip">点击画面开启声音</div>
    `;

    document.body.appendChild(panel);

    this.panel = panel;
    this.video = panel.querySelector(".newb-preview-video");
    this.danmakuLayer = panel.querySelector(".newb-preview-danmaku");
    this.titleEl = panel.querySelector(".newb-preview-title");
    this.tipEl = panel.querySelector(".newb-preview-tip");

    panel
      .querySelector(".newb-preview-close")
      .addEventListener("click", () => this.close());

    panel.addEventListener("mouseenter", () => clearTimeout(this.hideTimer));
    panel.addEventListener("mouseleave", () => this.scheduleHide());

    const grip = document.createElement("div");
    grip.className = "newb-preview-resize";
    panel.appendChild(grip);

    panel.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    panel.addEventListener("pointermove", (e) => this.onPointerMove(e));
    panel.addEventListener("pointerup", (e) => this.onPointerUp(e));
    panel.addEventListener("pointercancel", (e) => this.onPointerUp(e));

    panel
      .querySelector(".newb-preview-head")
      .addEventListener("dblclick", () => this.resetPosition());

    this.video.addEventListener("playing", () => this.startDanmakuLoop());
    this.video.addEventListener("pause", () => this.stopDanmakuLoop());
    this.video.addEventListener("seeking", () => this.resetDanmaku());
    this.video.addEventListener("ended", () => this.stopDanmakuLoop());

    this.video.addEventListener("click", () => {
      if (this.video.muted) {
        this.video.muted = false;
        this.video.play().catch(() => {});
        this.tipEl.classList.remove("show");
      }
    });
  }

  onPointerDown(e) {
    if (e.button !== 0 || !this.panel) return;
    if (e.target.closest(".newb-preview-close")) return;

    const rect = this.panel.getBoundingClientRect();

    if (e.target.closest(".newb-preview-resize")) {
      this.resizeState = { startX: e.clientX, startWidth: rect.width };
      this.panel.classList.add("is-resizing");
    } else if (e.target.closest(".newb-preview-head")) {
      this.dragState = {
        dx: e.clientX - rect.left,
        dy: e.clientY - rect.top,
      };
      this.panel.classList.add("is-dragging");
    } else {
      return;
    }

    try {
      this.panel.setPointerCapture?.(e.pointerId);
    } catch {}

    e.preventDefault();
  }

  onPointerMove(e) {
    if (!this.panel) return;

    if (this.dragState) {
      const rect = this.panel.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const left = Math.min(
        Math.max(0, e.clientX - this.dragState.dx),
        Math.max(0, vw - rect.width),
      );
      const top = Math.min(
        Math.max(0, e.clientY - this.dragState.dy),
        Math.max(0, vh - rect.height),
      );

      this.panel.style.left = `${left}px`;
      this.panel.style.top = `${top}px`;
      this.userPosition = { left, top };
    }

    if (this.resizeState) {
      const min = 320;
      const max = Math.min(960, window.innerWidth - 24);
      const width = Math.min(
        Math.max(min, this.resizeState.startWidth + (e.clientX - this.resizeState.startX)),
        Math.max(min, max),
      );

      this.panel.style.width = `${width}px`;
      this.userWidth = width;
    }
  }

  onPointerUp(e) {
    if (!this.panel) return;

    this.dragState = null;
    this.resizeState = null;
    this.panel.classList.remove("is-dragging", "is-resizing");
    try {
      this.panel.releasePointerCapture?.(e.pointerId);
    } catch {}
  }

  resetPosition() {
    this.userPosition = null;
    this.userWidth = null;

    if (this.panel) {
      this.panel.style.removeProperty("width");
      this.panel.style.removeProperty("left");
      this.panel.style.removeProperty("top");
    }

    if (this.currentAnchor) this.position(this.currentAnchor);
  }

  position(anchorRect) {
    if (!this.panel) return;

    if (this.userPosition) {
      this.panel.style.left = `${this.userPosition.left}px`;
      this.panel.style.top = `${this.userPosition.top}px`;
      return;
    }

    const panel = this.panel;
    const rect = panel.getBoundingClientRect();
    const { innerWidth: vw, innerHeight: vh } = window;
    const margin = 12;

    let left = anchorRect.left - rect.width - margin;
    let top = anchorRect.top;

    if (left < margin) {
      left = anchorRect.right + margin;
    }

    if (left < margin) {
      left = Math.max(margin, (vw - rect.width) / 2);
      top = anchorRect.bottom + margin;
    }

    const maxTop = vh - rect.height - margin;
    if (top > maxTop) top = maxTop;
    if (top < margin) top = margin;

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  scheduleHide() {
    clearTimeout(this.hideTimer);

    this.hideTimer = setTimeout(() => {
      if (this.dragState || this.resizeState) return;

      const card = document.getElementById("newb-video-info-card");
      if (card?.matches?.(":hover") || this.panel?.matches?.(":hover")) return;

      this.close();
      window.newbVideoInfoHover?.hideCard?.();
    }, 250);
  }

  async open({ view, anchorRect }) {
    if (!this.config.enabled || !view?.bvid) return;

    this.ensurePanel();

    if (!this.isOpen()) {
      this.userPosition = null;
      this.userWidth = null;
      this.panel.style.removeProperty("width");
      this.panel.style.removeProperty("left");
      this.panel.style.removeProperty("top");
    }

    this.dmSettings = this.readDanmakuSettings();
    clearTimeout(this.hideTimer);

    const sameVideo = this.currentBvid === view.bvid;
    this.currentBvid = view.bvid;
    this.currentAnchor = anchorRect;

    this.titleEl.textContent = view.title || "";

    if (!sameVideo) {
      this.resetDanmaku();
      this.video.pause();
      this.video.removeAttribute("src");
      this.video.load();
      this.tipEl.classList.remove("show");

      const url = await this.fetchPreviewUrl(view.bvid, view.cid).catch(() => "");
      if (this.currentBvid !== view.bvid) return;

      if (!url) {
        this.tipEl.textContent = "这个视频没有可用的预览";
        this.tipEl.classList.add("show");
      } else {
        this.tipEl.textContent = "点击画面开启声音";
        this.tipEl.classList.remove("show");
        this.video.src = url;
      }

      this.loadDanmaku(view.cid);
    }

    this.panel.classList.add("show");
    this.position(anchorRect);

    if (this.video.src) {
      this.video.muted = false;
      this.video.volume = 0.8;

      try {
        await this.video.play();
        this.tipEl.classList.remove("show");
      } catch {
        this.video.muted = true;
        this.tipEl.textContent = "点击画面开启声音";
        this.tipEl.classList.add("show");
        this.video.play().catch(() => {});
      }
    }
  }

  async fetchPreviewUrl(bvid, cid) {
    const query = new URLSearchParams({
      bvid,
      cid: String(cid || ""),
      qn: "16",
      fnval: "1",
      platform: "html5",
      high_quality: "1",
    });

    const res = await newbFetch(
      `https://api.bilibili.com/x/player/playurl?${query.toString()}`,
      { credentials: "include" },
    );

    const json = await res.json();
    if (json.code !== 0) return "";

    return json.data?.durl?.[0]?.url || "";
  }

  async loadDanmaku(cid) {
    if (!cid) return;

    this.dmCid = cid;

    if (this.dmCache.has(cid)) {
      this.dmList = this.dmCache.get(cid);
      this.dmIndex = 0;
      return;
    }

    try {
      const res = await fetch(
        `https://api.bilibili.com/x/v1/dm/list.so?oid=${cid}`,
      );
      const xml = await res.text();
      const doc = new DOMParser().parseFromString(xml, "text/xml");
      const list = [...doc.querySelectorAll("d")]
        .map((node) => {
          const parts = String(node.getAttribute("p") || "").split(",");
          return {
            time: Number(parts[0]) || 0,
            color: Number(parts[3]) || 0xffffff,
            text: node.textContent.trim(),
          };
        })
        .filter((item) => item.text)
        .sort((a, b) => a.time - b.time);

      this.dmCache.set(cid, list);
      if (this.dmCid !== cid) return;
      this.dmList = list;
      this.dmIndex = 0;
    } catch {
      this.dmList = [];
    }
  }

  startDanmakuLoop() {
    this.stopDanmakuLoop();

    const tick = () => {
      if (!this.video || this.video.paused) return;

      const time = this.video.currentTime;

      while (
        this.dmIndex < this.dmList.length &&
        this.dmList[this.dmIndex].time <= time
      ) {
        this.spawnDanmaku(this.dmList[this.dmIndex]);
        this.dmIndex += 1;
      }

      this.dmTimer = requestAnimationFrame(tick);
    };

    this.dmTimer = requestAnimationFrame(tick);
  }

  stopDanmakuLoop() {
    if (this.dmTimer) {
      cancelAnimationFrame(this.dmTimer);
      this.dmTimer = null;
    }
  }

  resetDanmaku() {
    this.stopDanmakuLoop();
    this.dmIndex = 0;
    if (this.danmakuLayer) this.danmakuLayer.textContent = "";

    const time = this.video?.currentTime || 0;
    while (
      this.dmIndex < this.dmList.length &&
      this.dmList[this.dmIndex].time < time
    ) {
      this.dmIndex += 1;
    }
  }

  spawnDanmaku(item) {
    if (!this.danmakuLayer) return;

    const settings = this.dmSettings || {};
    if (settings.enabled === false || settings.blockScroll) return;

    const areaPct = [25, 50, 75].includes(settings.area) ? settings.area : 96;
    const bold = settings.bold ? "700" : "600";
    const color = settings.blockColor
      ? 0xffffff
      : Number(item.color) || 0xffffff;

    const el = document.createElement("span");
    el.className = "newb-preview-dm";
    el.textContent = item.text;
    el.style.top = `${Math.random() * areaPct}%`;
    el.style.color = `#${color.toString(16).padStart(6, "0")}`;
    el.style.opacity = String(settings.opacity ?? 0.9);
    el.style.fontSize = `${Math.round(16 * (settings.fontScale ?? 1))}px`;
    el.style.animationDuration = `${(7 / (settings.speed || 1)).toFixed(2)}s`;
    el.style.fontWeight = bold;

    this.danmakuLayer.appendChild(el);
    el.addEventListener("animationend", () => el.remove(), { once: true });

    if (this.danmakuLayer.childElementCount > 60) {
      this.danmakuLayer.firstElementChild?.remove();
    }
  }

  close() {
    clearTimeout(this.hideTimer);
    this.stopDanmakuLoop();

    if (!this.panel) return;

    this.panel.classList.remove("show");
    this.video?.pause();

    if (this.video) {
      this.video.removeAttribute("src");
      this.video.load();
    }

    if (this.danmakuLayer) this.danmakuLayer.textContent = "";
    this.dmIndex = 0;
    this.currentBvid = null;
  }
}

window.newbVideoPreview = new VideoPreviewPlayer();
