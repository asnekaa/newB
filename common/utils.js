window.newbUtils = {
  formatNum(num) {
    const n = Number(num);
    if (isNaN(n)) return 0;

    return n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, "") + "万" : n;
  },
};
