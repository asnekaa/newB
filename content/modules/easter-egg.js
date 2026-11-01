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

  const PHRASES = [
    "前方高能",
    "233333",
    "awsl",
    "爷青回",
    "好活",
    "蚌埠住了",
    "DNA 动了",
    "典",
    "双厨狂喜",
    "泪目",
    "这次一定",
    "一键三连",
    "下次丕定",
    "高能预警",
    "太草了",
    "人类高质量弹幕",
    "newB！",
  ];

  const COLORS = ["#ffffff", "#fb7299", "#00aeec", "#ffd166", "#8bd29b", "#a78bfa"];

  let index = 0;
  let raining = false;

  const isTyping = (event) => {
    const target = event.target;
    if (!target) return false;
    if (target.isContentEditable) return true;
    return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
  };

  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  const rain = () => {
    if (raining || !document.body) return;
    raining = true;

    const layer = document.createElement("div");
    layer.id = "newb-danmaku-rain";

    for (let i = 0; i < 70; i += 1) {
      const item = document.createElement("span");
      item.className = "newb-danmaku-item";
      item.textContent = pick(PHRASES);
      item.style.top = `${Math.random() * 96}%`;
      item.style.fontSize = `${14 + Math.random() * 24}px`;
      item.style.color = pick(COLORS);
      item.style.animationDuration = `${2.8 + Math.random() * 4}s`;
      item.style.animationDelay = `${Math.random() * 1.6}s`;
      item.style.opacity = String(0.75 + Math.random() * 0.25);
      layer.appendChild(item);
    }

    document.body.appendChild(layer);
    setTimeout(() => {
      layer.remove();
      raining = false;
    }, 7000);
  };

  document.addEventListener(
    "keydown",
    (event) => {
      if (isTyping(event) || event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === SEQUENCE[index]) {
        index += 1;
        if (index === SEQUENCE.length) {
          index = 0;
          rain();
        }
        return;
      }
      index = key === SEQUENCE[0] ? 1 : 0;
    },
    true,
  );
})();
