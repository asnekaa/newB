class UserInfoHoverEngine {
  constructor() {
    this.config = { enabled: true, delay: 500 };
    this.card = null;
    this.showTimer = null;
    this.hideTimer = null;
    this.currentMid = null;
    this.currentTarget = null;

    this.bindEvents();
  }

  updateConfig(config) {
    const isMasterOn = config.masterSwitch ?? true;
    this.config.enabled = isMasterOn && (config.ui?.userInfoHover ?? true);
    this.config.delay = config.ui?.infoHoverDelay ?? 500;

    if (!this.config.enabled) this.hideCard();
  }

  getCard() {
    if (!this.card) {
      this.card = document.createElement("div");
      this.card.id = "newb-user-info-card";
      document.body.appendChild(this.card);

      this.card.addEventListener("mouseenter", () =>
        clearTimeout(this.hideTimer),
      );
      this.card.addEventListener("mouseleave", () => {
        this.hideTimer = setTimeout(() => this.hideCard(), 200);
      });

      this.card.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-act]");
        if (!btn) return;

        const act = parseInt(btn.dataset.act);
        const mid = btn.dataset.mid;

        try {
          btn.style.opacity = "0.5";
          btn.style.pointerEvents = "none";

          await window.newbAPI.modifyRelation(mid, act);

          this.showCardFor(this.currentTarget, mid, true);
        } catch (err) {
          console.error("newB: 关注/拉黑操作失败", err);
          btn.style.opacity = "1";
          btn.style.pointerEvents = "auto";
        }
      });
    }
    return this.card;
  }

  renderCard(data, mid, target, bannerUrl) {
    const { info, stat, upstat, relation } = data;
    const card = this.getCard();

    if (!info) {
      card.innerHTML = `<div class="newb-hover-error" style="padding: 20px; text-align: center; color: #fb7299;">获取用户信息失败</div>`;
      return;
    }

    const avatarUrl = info.face || "";
    const name = info.name || "";
    const sign = info.sign || "这个人很懒，什么都没有写~";
    const level = info.level || 0;
    const sex = info.sex === "男" ? "♂" : info.sex === "女" ? "♀" : "";
    const sexColor =
      info.sex === "男" ? "#00aeec" : info.sex === "女" ? "#fb7299" : "#9499a0";
    const sexHtml = sex
      ? `<span class="newb-u-sex" style="color: ${sexColor}">${sex}</span>`
      : "";

    let vipHtml = "";
    let nameColor = "";
    if (info.vip && info.vip.status === 1) {
      nameColor = "#fb7299";
      const label = info.vip.label || {
        text: "大会员",
        bg_color: "#fb7299",
        text_color: "#fff",
      };
      vipHtml = `<span class="newb-u-vip" style="background-color: ${label.bg_color}; color: ${label.text_color};">${label.text}</span>`;
    }
    const nameStyle = nameColor ? `style="color: ${nameColor};"` : "";

    const lvLevel = Math.max(0, Math.min(6, Number(level) || 0));
    const lvIndex = lvLevel >= 6 && info.is_senior_member === 1 ? 10 : lvLevel;
    const lvSpriteUrl = chrome.runtime.getURL("assets/bililv.svg");
    const levelHtml = `<span class="newb-u-level${lvIndex === 10 ? " is-senior" : ""}" title="Lv${lvLevel}${lvIndex === 10 ? " 硬核会员" : ""}" style="--lv: ${lvIndex}; background-image: url('${lvSpriteUrl}');"></span>`;

    let verifyHtml = "";
    if (info.official && info.official.role !== 0) {
      const vColor = info.official.type === 0 ? "#f3a034" : "#00aeec";
      verifyHtml = `<div class="newb-u-verify" style="color: ${vColor}"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="currentColor"/><g transform="translate(1.65, 1.65) scale(0.9)"><path d="M10.5 6h-3l1-4c.1-.3-.2-.5-.5-.4L3.5 7.5c-.2.2-.1.5.2.5h3l-1 4c-.1.3.2.5.5.4l4.5-5.9c.2-.2.1-.5-.2-.5z" fill="#fff"/></g></svg>${info.official.title}</div>`;
    }

    const cookieMatch = document.cookie.match(/DedeUserID=([^;]+)/);
    const myMid = cookieMatch ? cookieMatch[1] : null;
    const isSelf = mid === myMid;
    let relAttr = relation ? relation.relation.attribute : 0;
    let followBtnHtml = "";
    let blockBtnHtml = "";

    if (!isSelf) {
      if (relAttr === 128) {
        followBtnHtml = `<button class="newb-u-btn btn-disabled" disabled>已拉黑</button>`;
        blockBtnHtml = `<button class="newb-u-btn btn-blocked" data-act="6" data-mid="${mid}">取消拉黑</button>`;
      } else {
        const text =
          relAttr === 2 || relAttr === 6
            ? relAttr === 6
              ? "已互粉"
              : "已关注"
            : "+ 关注";
        const cls =
          relAttr === 2 || relAttr === 6 ? "btn-followed" : "btn-follow";
        const act = relAttr === 2 || relAttr === 6 ? 2 : 1;
        followBtnHtml = `<button class="newb-u-btn ${cls}" data-act="${act}" data-mid="${mid}">${text}</button>`;
        blockBtnHtml = `<button class="newb-u-btn btn-block" data-act="5" data-mid="${mid}">拉黑</button>`;
      }
    }

    const { formatNum } = window.newbUtils;
    const following = stat ? stat.following : 0;
    const follower = stat ? stat.follower : 0;
    const likes = upstat ? upstat.likes : 0;
    const views = upstat?.archive?.view || 0;

    card.innerHTML = `
            <div class="newb-hover-content">
                <div class="newb-u-banner" style="background-image: url('${bannerUrl}');"></div>
                <div class="newb-u-content">
                    <div class="newb-u-header">
                        <img class="newb-u-avatar" src="${avatarUrl}@100w_100h_1c.webp" referrerpolicy="no-referrer">
                        <div class="newb-u-actions">
                            ${followBtnHtml}
                            ${!isSelf ? `<a class="newb-u-btn btn-msg" href="https://message.bilibili.com/#/whisper/mid${mid}" target="_blank">私信</a>` : ""}
                            ${blockBtnHtml}
                        </div>
                    </div>
                    <div class="newb-u-name-row">
                        <span class="newb-u-name" title="${name}" ${nameStyle}>${name}</span>
                        ${sexHtml}
                        ${levelHtml}
                        ${vipHtml}
                    </div>
                    <div class="newb-u-uid" title="点击复制 UID">UID: ${mid}<span class="newb-u-uid-tip"></span></div>
                    ${verifyHtml}
                    <div class="newb-u-stats">
                        <div><span>关注</span><b>${formatNum(following)}</b></div>
                        <div><span>粉丝</span><b>${formatNum(follower)}</b></div>
                        <div><span>获赞</span><b>${formatNum(likes)}</b></div>
                        <div><span>播放</span><b>${formatNum(views)}</b></div>
                    </div>
                    <div class="newb-u-sign" title="${sign}">${sign}</div>
                </div>
            </div>
        `;

    const uidEl = card.querySelector(".newb-u-uid");
    const uidTip = uidEl?.querySelector(".newb-u-uid-tip");
    if (uidEl && uidTip) {
      let tipTimer = null;
      const showTip = (text, ok) => {
        uidTip.textContent = text;
        uidTip.classList.toggle("is-failed", !ok);
        uidTip.classList.add("show");
        clearTimeout(tipTimer);
        tipTimer = setTimeout(() => {
          uidTip.classList.remove("show");
          setTimeout(() => {
            uidTip.textContent = "";
          }, 160);
        }, 1200);
      };
      uidEl.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(String(mid));
          showTip("已复制", true);
        } catch {
          showTip("复制失败", false);
        }
      });
    }

    this.positionCard(target.getBoundingClientRect());
  }

  positionCard(targetRect) {
    const card = this.getCard();
    const cardRect = card.getBoundingClientRect();
    const { innerWidth: vw, innerHeight: vh } = window;
    const margin = 15;

    let left = targetRect.right + margin;
    let top = targetRect.top;

    if (left + cardRect.width > vw) {
      left = targetRect.left - cardRect.width - margin;
    }

    if (left < 0) {
      left = Math.max(10, (vw - cardRect.width) / 2);
      top = targetRect.bottom + margin;
    }

    if (top + cardRect.height > vh) {
      top = vh - cardRect.height - margin;
    }

    if (top < 0) top = margin;

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  async showCardFor(target, mid, forceRefresh = false) {
    if (!forceRefresh) {
      this.currentMid = mid;
      this.currentTarget = target;
    }
    const card = this.getCard();

    if (!forceRefresh) {
      const hasVerify =
        !!target
          .closest(".up-name")
          ?.querySelector(".svg-icon.verify, .auth-icon") ||
        !!target.querySelector(".verify-icon");

      card.innerHTML = `
                <div class="newb-skeleton newb-u-skel-banner"></div>
                <div class="newb-u-content">
                    <div class="newb-u-header">
                        <div class="newb-skeleton newb-u-skel-avatar"></div>
                        <div class="newb-u-actions"><div class="newb-skeleton newb-u-skel-btn"></div></div>
                    </div>
                    <div class="newb-skeleton newb-u-skel-name"></div>
                    <div class="newb-skeleton newb-u-skel-verify ${hasVerify ? "show" : ""}"></div>
                    <div class="newb-u-stats">
                        <div class="newb-skeleton newb-u-skel-stat"></div>
                        <div class="newb-skeleton newb-u-skel-stat"></div>
                        <div class="newb-skeleton newb-u-skel-stat"></div>
                        <div class="newb-skeleton newb-u-skel-stat"></div>
                    </div>
                    <div class="newb-skeleton newb-u-skel-sign"></div>
                </div>
            `;
      card.classList.add("show");
      this.positionCard(target.getBoundingClientRect());
    }

    try {
      const data = await window.newbAPI.fetchUserProfile(mid);
      if (this.currentMid !== mid) return;

      const info = data.info || {};
      const rawBanner =
        info.top_photo_v2?.l_img ||
        info.top_photo ||
        "https://i2.hdslb.com/bfs/activity-plat/static/VqxBIh6Te8.png";
      const bannerUrl = rawBanner.replace(/^http:/, "https:") + "@.webp";

      const img = new Image();
      img.src = bannerUrl;

      const executeRender = () => {
        if (this.currentMid !== mid) return;
        this.renderCard(data, mid, target, bannerUrl);
      };

      img.onload = executeRender;
      img.onerror = executeRender;
    } catch (e) {
      if (this.currentMid === mid) {
        card.innerHTML = `<div class="newb-hover-error" style="padding: 20px; text-align: center; color: #fb7299;">获取信息失败</div>`;
        card.classList.add("show");
        this.positionCard(target.getBoundingClientRect());
      }
    }
  }

  hideCard() {
    this.card?.classList.remove("show");
    this.currentMid = null;
  }

  resolveMid(el) {
    if (!el || typeof el.closest !== "function") return null;

    const node = el.closest("a, [data-user-id], [data-uid]");

    if (node) {
      if (node.dataset?.userId) return String(node.dataset.userId);
      if (node.dataset?.uid) return String(node.dataset.uid);

      const href = String(node.getAttribute?.("href") || node.href || "");
      const match = href.match(/space\.bilibili\.com\/(\d+)/);
      if (match) return match[1];
    }

    const dyn = el.closest(
      ".bili-dyn-item, .bili-dyn-card-video, .bili-dyn-title",
    );
    const link = dyn?.querySelector?.('a[href*="space.bilibili.com"]');
    const dynHref = String(link?.getAttribute?.("href") || link?.href || "");
    const dynMatch = dynHref.match(/space\.bilibili\.com\/(\d+)/);
    if (dynMatch) return dynMatch[1];

    return null;
  }

  hoverTarget(event) {
    return (
      event.target?.closest?.(
        "a, [data-user-id], [data-uid], .bili-dyn-title__text",
      ) || null
    );
  }

  keepForSameMid(target, event, mid) {
    const related = event.relatedTarget;

    if (related && this.card?.contains(related)) return true;
    if (related && this.resolveMid(related) === mid) return true;

    const rect = target?.getBoundingClientRect?.();
    if (
      rect &&
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    ) {
      return true;
    }

    const under = document.elementFromPoint?.(event.clientX, event.clientY);
    return Boolean(under && this.resolveMid(under) === mid);
  }

  bindEvents() {
    document.addEventListener("mouseover", (e) => {
      if (!this.config.enabled) return;

      const target = this.hoverTarget(e);
      if (!target || (e.relatedTarget && target.contains(e.relatedTarget)))
        return;

      const mid = this.resolveMid(target);
      if (!mid) return;

      clearTimeout(this.hideTimer);
      if (this.currentMid === mid && this.card?.classList.contains("show"))
        return;

      clearTimeout(this.showTimer);
      this.showTimer = setTimeout(
        () => this.showCardFor(target, mid),
        this.config.delay,
      );
    });

    document.addEventListener("mouseout", (e) => {
      if (!this.config.enabled) return;

      const target = this.hoverTarget(e);
      if (!target || (e.relatedTarget && target.contains(e.relatedTarget)))
        return;

      const mid = this.resolveMid(target);
      if (!mid) return;

      if (this.keepForSameMid(target, e, mid)) return;

      clearTimeout(this.showTimer);
      this.hideTimer = setTimeout(() => {
        if (this.card?.matches?.(":hover")) return;

        const under = document.elementFromPoint?.(e.clientX, e.clientY);
        if (under && this.resolveMid(under) === mid) return;

        this.hideCard();
      }, 200);
    });
  }
}

window.newbUserInfoHover = new UserInfoHoverEngine();
