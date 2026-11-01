(() => {
  const SEQUENCE = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];

  const COLORS = ["#ffffff", "#fb7299", "#00aeec", "#ffd166", "#8bd29b", "#a78bfa"];

  let index = 0;
  let running = false;

  const isVideoPage = () =>
    /^\/video\//.test(location.pathname) || /^\/list\//.test(location.pathname);

  const isTyping = (event) => {
    const target = event.target;
    if (!target) return false;
    if (target.isContentEditable) return true;
    return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
  };

  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  const shuffle = (list) => {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const extractDanmaku = async () => {
    const match = location.pathname.match(/\/video\/(BV[0-9A-Za-z]+)/);
    if (!match || !window.newbAPI) return [];
    try {
      const info = await window.newbAPI.fetchVideoInfo(match[1]);
      const cid = info?.View?.cid;
      if (!cid) return [];
      const res = await fetch(`https://api.bilibili.com/x/v1/dm/list.so?oid=${cid}`);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, "text/xml");
      const list = [...doc.querySelectorAll("d")]
        .map((node) => node.textContent.trim())
        .filter((item) => item && item.length >= 2 && item.length <= 18);
      return shuffle([...new Set(list)]).slice(0, 40);
    } catch {
      return [];
    }
  };

  const rain = async (phrases) => {
    if (running || !document.body || !phrases.length) return;
    running = true;

    const layer = document.createElement("div");
    layer.id = "newb-danmaku-rain";

    const items = [];
    for (const text of phrases) {
      const item = document.createElement("span");
      item.className = "newb-danmaku-item";
      item.textContent = text;
      item.style.top = `${Math.random() * 96}%`;
      item.style.fontSize = `${14 + Math.random() * 20}px`;
      item.style.color = pick(COLORS);
      item.style.animationDuration = `${6 + Math.random() * 4.5}s`;
      item.style.animationDelay = `${Math.random() * 2.2}s`;
      item.style.opacity = String(0.75 + Math.random() * 0.25);
      layer.appendChild(item);
      items.push(item);
    }

    document.body.appendChild(layer);

    let finished = 0;
    const done = () => {
      finished += 1;
      if (finished >= items.length) {
        layer.remove();
        running = false;
      }
    };
    items.forEach((item) => {
      item.addEventListener("animationend", done, { once: true });
    });

    setTimeout(() => {
      if (layer.isConnected) {
        layer.remove();
        running = false;
      }
    }, 15000);
  };

  document.addEventListener(
    "keydown",
    async (event) => {
      if (running || isTyping(event)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key !== SEQUENCE[index]) {
        index = key === SEQUENCE[0] ? 1 : 0;
        return;
      }

      index += 1;
      if (index < SEQUENCE.length) return;

      index = 0;
      if (!isVideoPage()) return;

      const phrases = await extractDanmaku();
      if (phrases.length === 0) {
        console.log("newB: 这个视频没有可用弹幕，彩蛋不触发");
        return;
      }
      rain(phrases);
    },
    true,
  );
})();
