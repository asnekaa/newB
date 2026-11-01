const VIDEO_TYPE_MAP = {
  1: "动画",
  24: "MAD·AMV",
  25: "MMD·3D",
  47: "短片·手书",
  210: "手办·模玩",
  86: "特摄",
  253: "动漫杂谈",
  27: "综合",
  13: "番剧",
  51: "资讯",
  152: "官方延伸",
  32: "完结动画",
  33: "连载动画",
  167: "国创",
  153: "国产动画",
  168: "国产原创相关",
  169: "布袋戏",
  170: "资讯",
  195: "动态漫·广播剧",
  3: "音乐",
  28: "原创音乐",
  31: "翻唱",
  30: "VOCALOID·UTAU",
  59: "演奏",
  193: "MV",
  29: "音乐现场",
  130: "音乐综合",
  243: "乐评盘点",
  244: "音乐教学",
  129: "舞蹈",
  20: "宅舞",
  154: "舞蹈综合",
  156: "舞蹈教程",
  198: "街舞",
  199: "明星舞蹈",
  200: "国风舞蹈",
  4: "游戏",
  17: "单机游戏",
  171: "电子竞技",
  172: "手机游戏",
  65: "网络游戏",
  173: "桌游棋牌",
  121: "GMV",
  136: "音游",
  19: "Mugen",
  36: "知识",
  201: "科学科普",
  124: "社科·法律·心理",
  228: "人文历史",
  207: "财经商业",
  208: "校园学习",
  209: "职业职场",
  229: "设计·创意",
  122: "野生技术协会",
  188: "科技",
  95: "数码",
  230: "软件应用",
  231: "计算机技术",
  232: "科工机械",
  233: "极客DIY",
  234: "运动",
  235: "篮球",
  249: "足球",
  164: "健身",
  236: "竞技体育",
  237: "运动文化",
  238: "运动综合",
  223: "汽车",
  245: "赛车",
  246: "改装玩车",
  247: "新能源车",
  248: "房车",
  240: "摩托车",
  227: "购车攻略",
  176: "汽车生活",
  160: "生活",
  138: "搞笑",
  250: "出行",
  251: "三农",
  239: "家居房产",
  161: "手工",
  162: "绘画",
  21: "日常",
  211: "美食",
  76: "美食制作",
  212: "美食侦探",
  213: "美食测评",
  214: "田园美食",
  215: "美食记录",
  217: "动物圈",
  218: "喵星人",
  219: "汪星人",
  221: "野生动物",
  222: "小宠异宠",
  75: "动物综合",
  119: "鬼畜",
  22: "鬼畜调教",
  26: "音MAD",
  126: "人力VOCALOID",
  216: "鬼畜剧场",
  127: "教程演示",
  155: "时尚",
  157: "美妆护肤",
  252: "仿妆cos",
  158: "穿搭",
  159: "时尚潮流",
  202: "资讯",
  203: "热点",
  204: "环球",
  205: "社会",
  206: "综合",
  5: "娱乐",
  71: "综艺",
  241: "娱乐杂谈",
  242: "粉丝创作",
  137: "明星综合",
  181: "影视",
  182: "影视杂谈",
  183: "影视剪辑",
  85: "小剧场",
  184: "预告·资讯",
  177: "纪录片",
  37: "人文·历史",
  178: "科学·探索·自然",
  179: "军事",
  180: "社会·美食·旅行",
  23: "电影",
  147: "华语电影",
  145: "欧美电影",
  146: "日本电影",
  83: "其他国家",
  11: "电视剧",
  185: "国产剧",
  187: "海外剧",
  257: "配音",
  174: "其他",
};

class VideoInfoHoverEngine {
  constructor() {
    this.config = { enabled: true, delay: 500 };
    this.card = null;
    this.showTimer = null;
    this.hideTimer = null;
    this.currentBvid = null;
    this.currentTarget = null;
    this.currentAnchor = null;
    this.hoverBvid = null;
    this.pendingBvid = null;
    this.showToken = 0;

    this.bindEvents();
  }

  updateConfig(config) {
    const isMasterOn = config.masterSwitch ?? true;
    this.config.enabled = isMasterOn && (config.ui?.videoInfoHover ?? true);
    this.config.aiEnabled = isMasterOn && (config.ui?.videoInfoHoverAi ?? true);
    this.config.replyEnabled =
      isMasterOn && (config.ui?.videoInfoHoverReply ?? true);
    this.config.delay = config.ui?.infoHoverDelay ?? 500;

    if (!this.config.enabled) this.hideCard();
  }

  getCard() {
    if (!this.card) {
      this.card = document.createElement("div");
      this.card.id = "newb-video-info-card";
      document.body.appendChild(this.card);

      this.card.addEventListener("mouseenter", () =>
        clearTimeout(this.hideTimer),
      );
      this.card.addEventListener("mouseleave", () => {
        this.hideTimer = setTimeout(() => this.hideCard(), 200);
      });

      this.card.addEventListener("click", (e) => {
        const btn = e.target.closest(".newb-expand-btn");
        if (btn) {
          const textEl = btn.previousElementSibling;
          if (textEl) {
            const isExpanded = textEl.classList.toggle("is-expanded");
            btn.innerHTML = isExpanded ? "收起 ▴" : "展开 ▾";
            if (this.currentTarget)
              this.positionCard(
                this.currentAnchor ||
                  this.currentTarget.getBoundingClientRect(),
              );
            const card = this.getCard();
            const btnRect = btn.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();
            if (btnRect.bottom > cardRect.bottom - 8) {
              card.scrollTop += btnRect.bottom - (cardRect.bottom - 8);
            } else if (btnRect.top < cardRect.top + 8) {
              card.scrollTop -= cardRect.top + 8 - btnRect.top;
            }
          }
          return;
        }

        const timeBtn = e.target.closest(".newb-ai-time");
        if (timeBtn && this.currentBvid) {
          const time = timeBtn.dataset.time;
          if (time) {
            window.open(
              `https://www.bilibili.com/video/${this.currentBvid}/?t=${time}`,
              "_blank",
            );
          }
        }
      });
    }
    return this.card;
  }

  formatSeconds(sec) {
    if (!sec || isNaN(sec)) return "00:00";
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n) => n.toString().padStart(2, "0");
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  }

  formatDate(timestamp) {
    const d = new Date(timestamp * 1000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  renderCard(data) {
    const {
      View: view,
      Tags: tags = [],
      Conclusion: conclusion,
      Reply: reply,
    } = data;
    const type = VIDEO_TYPE_MAP[view.tid] || "未知";

    const tagsHtml = tags
      .slice(0, 6)
      .map((t) => `<span class="newb-tag">${t.tag_name}</span>`)
      .join("");

    const timeStr = this.formatDate(view.pubdate);
    const upName = view.owner?.name || "未知UP";
    const { formatNum } = window.newbUtils;

    let aiHtml = "";
    if (this.config.aiEnabled) {
      if (
        conclusion &&
        conclusion.model_result &&
        conclusion.model_result.result_type !== 0
      ) {
        const summary = conclusion.model_result.summary;
        const outline = conclusion.model_result.outline;

        let outlineHtml = "";
        if (outline && outline.length > 0) {
          outlineHtml = outline
            .map(
              (sec) => `
                        <div class="newb-ai-sec">
                            <div class="newb-ai-sec-title">${sec.title}</div>
                            ${sec.part_outline
                              .map(
                                (part) => `
                                <div class="newb-ai-part">
                                    <span class="newb-ai-time" data-time="${part.timestamp}">${this.formatSeconds(part.timestamp)}</span>
                                    <span class="newb-ai-content">${part.content}</span>
                                </div>
                            `,
                              )
                              .join("")}
                        </div>
                    `,
            )
            .join("");
        }
        aiHtml = `
                    <div class="newb-hover-ai">
                        <div class="newb-ai-header">
                            <svg width="16" height="16" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.53976 2.34771C8.17618 1.81736 9.12202 1.90335 9.65237 2.53976L12.1524 5.53976C12.6827 6.17618 12.5967 7.12202 11.9603 7.65237C11.3239 8.18272 10.3781 8.09673 9.84771 7.46031L7.34771 4.46031C6.81736 3.8239 6.90335 2.87805 7.53976 2.34771Z" fill="#18191c"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M21.9602 2.34771C21.3238 1.81736 20.378 1.90335 19.8476 2.53976L17.3476 5.53976C16.8173 6.17618 16.9033 7.12202 17.5397 7.65237C18.1761 8.18272 19.1219 8.09673 19.6523 7.46031L22.1523 4.46031C22.6826 3.8239 22.5967 2.87805 21.9602 2.34771Z" fill="#18191c"></path><path d="M4.78613 14.2091C4.78613 11.9263 6.44484 9.96205 8.71139 9.6903C13.2069 9.1513 16.7678 9.13141 21.3132 9.68091C23.5697 9.95371 25.2147 11.9138 25.2147 14.1868V19.192C25.2147 21.3328 23.7551 23.2258 21.6452 23.5884C16.903 24.4032 13.1705 24.2461 8.55936 23.5137C6.36235 23.1647 4.78613 21.2323 4.78613 19.0078V14.2091Z" fill="#18191c"></path></svg>
                            AI 视频总结
                        </div>
                        <div class="newb-ai-summary">${summary || ""}</div>
                        <div class="newb-ai-outline">${outlineHtml}</div>
                    </div>
                `;
      } else {
        aiHtml = `
                    <div class="newb-hover-ai empty">
                        <div class="newb-ai-header">
                            <svg width="16" height="16" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.53976 2.34771C8.17618 1.81736 9.12202 1.90335 9.65237 2.53976L12.1524 5.53976C12.6827 6.17618 12.5967 7.12202 11.9603 7.65237C11.3239 8.18272 10.3781 8.09673 9.84771 7.46031L7.34771 4.46031C6.81736 3.8239 6.90335 2.87805 7.53976 2.34771Z" fill="#9499a0"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M21.9602 2.34771C21.3238 1.81736 20.378 1.90335 19.8476 2.53976L17.3476 5.53976C16.8173 6.17618 16.9033 7.12202 17.5397 7.65237C18.1761 8.18272 19.1219 8.09673 19.6523 7.46031L22.1523 4.46031C22.6826 3.8239 22.5967 2.87805 21.9602 2.34771Z" fill="#9499a0"></path><path d="M4.78613 14.2091C4.78613 11.9263 6.44484 9.96205 8.71139 9.6903C13.2069 9.1513 16.7678 9.13141 21.3132 9.68091C23.5697 9.95371 25.2147 11.9138 25.2147 14.1868V19.192C25.2147 21.3328 23.7551 23.2258 21.6452 23.5884C16.903 24.4032 13.1705 24.2461 8.55936 23.5137C6.36235 23.1647 4.78613 21.2323 4.78613 19.0078V14.2091Z" fill="#9499a0"></path></svg>
                            该视频暂无 AI 总结
                        </div>
                    </div>
                `;
      }
    }

    let replyHtml = "";
    if (this.config.replyEnabled) {
      const replies = reply?.replies;
      if ((replies && replies.length > 0) || reply?.top) {
        const top = reply?.top;
        const pinned =
          (top && !Array.isArray(top) && (top.upper || top.admin)) ||
          (Array.isArray(top) && top[0]) ||
          (Array.isArray(reply?.top_replies) && reply.top_replies[0]) ||
          null;
        let hotComment =
          pinned ||
          (replies && replies.length > 0
            ? replies.reduce((l, r) => ((l.like || 0) > (r.like || 0) ? l : r))
            : null);
        if (hotComment) {
          const member = hotComment.member;
          const content = hotComment.content;
          let message = content.message;

          if (content.emote) {
            for (const [key, emote] of Object.entries(content.emote)) {
              message = message.replaceAll(
                key,
                `<img src="${emote.url}" style="height: 1.2em; vertical-align: text-bottom; display: inline-block;">`,
              );
            }
          }

          const pictures = (Array.isArray(content.pictures)
            ? content.pictures
            : []
          )
            .map((pic) =>
              String(pic?.img_src || pic?.img_src_webp || "")
                .replace(/^\/\//, "https://")
                .replace(/^http:\/\//i, "https://"),
            )
            .filter(Boolean)
            .slice(0, 3);
          const picsHtml = pictures.length
            ? `<div class="newb-reply-pics">${pictures
                .map(
                  (src) =>
                    `<img class="newb-reply-pic" src="${src}" alt="" loading="lazy" referrerpolicy="no-referrer">`,
                )
                .join("")}</div>`
            : "";

          replyHtml = `
                        <div class="newb-hover-reply">
                            <div class="newb-reply-header">
                                <span class="newb-pill${pinned ? " is-pinned" : ""}">${pinned ? "置顶" : "热评"}</span>
                                ${hotComment.like ? `<span class="newb-reply-like">${formatNum(hotComment.like)} 赞</span>` : ""}
                            </div>
                            <div class="newb-reply-content">
                                <span class="newb-reply-user">${member.uname}:</span>
                                <span class="newb-reply-text">${message}</span>
                            </div>
                            ${picsHtml}
                        </div>
                    `;
        }
      }
    }

    const cover = String(view.pic || "")
      .replace(/^\/\//, "https://")
      .replace(/^http:\/\//i, "https://");
    const coverHtml = cover
      ? `<img class="newb-cover" src="${cover}" alt="" loading="lazy" referrerpolicy="no-referrer">`
      : "";
    const durationHtml = view.duration
      ? `<span class="newb-hover-dur">${this.formatSeconds(view.duration)}</span>`
      : "";

    const card = this.getCard();
    card.innerHTML = `
            <div class="newb-hover-content">
                <div class="newb-hover-head">
                    ${coverHtml}
                    <div class="newb-head-main">
                        <div class="newb-hover-title">${view.title}</div>
                        <div class="newb-hover-meta">
                            <span class="newb-hover-up">${upName}</span>
                            <span class="newb-hover-time">${timeStr}</span>
                            ${durationHtml}
                        </div>
                        <div class="newb-hover-tags">
                            <span class="newb-hover-type">#${type}</span>
                            ${tagsHtml}
                        </div>
                    </div>
                </div>
                <div class="newb-hover-desc">${view.desc || "暂无简介"}</div>
                <div class="newb-hover-stats">
                    ${[
                      ["播放", view.stat.view],
                      ["弹幕", view.stat.danmaku],
                      ["点赞", view.stat.like],
                      ["硬币", view.stat.coin],
                      ["收藏", view.stat.favorite],
                      ["分享", view.stat.share],
                    ]
                      .map(
                        ([label, value]) =>
                          `<div class="newb-stat"><b>${formatNum(value)}</b><span>${label}</span></div>`,
                      )
                      .join("")}
                </div>
                ${aiHtml}
                ${replyHtml}
            </div>
        `;

    requestAnimationFrame(() => {
      const checkOverflow = (selector) => {
        const el = card.querySelector(selector);
        if (el && el.scrollHeight > el.clientHeight) {
          el.insertAdjacentHTML(
            "afterend",
            `<div class="newb-expand-btn">展开 ▾</div>`,
          );
        }
      };
      checkOverflow(".newb-hover-desc");
      checkOverflow(".newb-reply-content");

      card.querySelectorAll(".newb-reply-pic").forEach((pic) => {
        pic.addEventListener("error", () => pic.remove());
        pic.addEventListener("click", () =>
          window.open(pic.src, "_blank", "noopener"),
        );
      });

      const coverEl = card.querySelector(".newb-cover");
      if (coverEl) {
        coverEl.addEventListener("error", () => coverEl.remove());
        coverEl.addEventListener("click", () => {
          if (this.currentBvid) {
            window.open(
              `https://www.bilibili.com/video/${this.currentBvid}`,
              "_blank",
              "noopener",
            );
          }
        });
      }
    });
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

  async showCardFor(target, bvid, anchor = null) {
    const showToken = ++this.showToken;
    this.currentBvid = bvid;
    this.currentTarget = target;
    this.currentAnchor = anchor;
    const card = this.getCard();
    const anchorRect = anchor || target.getBoundingClientRect();

    const rawTitle = target.innerText || target.title || "";
    const isTwoLines = rawTitle.length > 24;

    card.classList.remove("is-expanded");
    const skeletonAiHtml = this.config.aiEnabled
      ? `<div class="newb-skeleton newb-skel-ai"></div>`
      : "";
    card.innerHTML = `
            <div class="newb-skel-head">
                <div class="newb-skeleton newb-skel-cover"></div>
                <div class="newb-skel-head-main">
                    <div class="newb-skeleton newb-skel-title ${isTwoLines ? "is-two-lines" : ""}"></div>
                    <div class="newb-skeleton newb-skel-desc short"></div>
                    <div class="newb-skel-tags">
                        <div class="newb-skeleton newb-skel-tag"></div>
                        <div class="newb-skeleton newb-skel-tag"></div>
                    </div>
                </div>
            </div>
            <div class="newb-skeleton newb-skel-desc"></div>
            <div class="newb-skeleton newb-skel-desc short"></div>
            <div class="newb-skeleton newb-skel-stats"></div>
            ${skeletonAiHtml}
        `;
    card.classList.add("show");
    card.scrollTop = 0;
    this.positionCard(anchorRect);

    try {
      const data = await window.newbAPI.fetchVideoInfo(bvid);

      if (this.currentBvid !== bvid || showToken !== this.showToken) return;

      const aid = data.View.aid;
      const cid = data.View.cid;
      const up_mid = data.View.owner.mid;

      const [conclusionRes, replyRes] = await Promise.allSettled([
        this.config.aiEnabled
          ? window.newbAPI.fetchVideoConclusion(bvid, cid, up_mid)
          : Promise.resolve(null),
        this.config.replyEnabled
          ? window.newbAPI.fetchVideoReply(aid)
          : Promise.resolve(null),
      ]);

      if (this.currentBvid !== bvid || showToken !== this.showToken) return;

      data.Conclusion =
        conclusionRes.status === "fulfilled" ? conclusionRes.value : null;
      data.Reply = replyRes.status === "fulfilled" ? replyRes.value : null;

      this.renderCard(data);
      this.positionCard(anchorRect);
    } catch (e) {
      if (showToken === this.showToken) {
        card.innerHTML = `<div class="newb-hover-error">获取信息失败</div>`;
      }
    }
  }

  hideCard() {
    this.showToken++;
    this.pendingBvid = null;
    this.card?.classList.remove("show");
    this.currentBvid = null;
    this.currentAnchor = null;
  }

  bindEvents() {
    document.addEventListener("mouseover", (e) => {
      if (!this.config.enabled) return;

      const target = e.target.closest("a");
      if (
        !target?.href ||
        (e.relatedTarget && target.contains(e.relatedTarget))
      )
        return;

      const match = target.href.match(/\/video\/(BV[a-zA-Z0-9]+)/);
      if (!match) {
        this.hoverBvid = null;
        return;
      }

      const bvid = match[1];
      this.hoverBvid = bvid;

      clearTimeout(this.hideTimer);
      if (this.currentBvid === bvid && this.card?.classList.contains("show"))
        return;

      if (this.pendingBvid === bvid) return;

      clearTimeout(this.showTimer);
      this.pendingBvid = bvid;
      const anchor = target.getBoundingClientRect();
      this.showTimer = setTimeout(() => {
        this.pendingBvid = null;
        if (this.hoverBvid !== bvid) return;
        this.showCardFor(target, bvid, anchor);
      }, this.config.delay);
    });

    document.addEventListener("mouseout", (e) => {
      if (!this.config.enabled) return;

      const target = e.target.closest("a");
      if (
        !target?.href ||
        (e.relatedTarget && target.contains(e.relatedTarget))
      )
        return;
      if (!target.href.match(/\/video\/(BV[a-zA-Z0-9]+)/)) return;

      this.hoverBvid = null;
      this.pendingBvid = null;

      clearTimeout(this.showTimer);
      this.hideTimer = setTimeout(() => this.hideCard(), 200);
    });
  }
}

window.newbVideoInfoHover = new VideoInfoHoverEngine();
