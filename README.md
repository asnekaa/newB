一个优化B站的插件 （自己做着玩的doge）

## 目录结构

```
manifest.json          扩展清单（版本号唯一来源）
popup/                 设置面板（popup.html / popup.css / popup.js）
_locales/              国际化文案
assets/                图标与静态资源

common/                公共库（页面无关）
  bili-api.js          哔哩哔哩接口封装（WBI 签名、视频/评论/用户数据）
  config-manager.js    配置读写与默认值
  utils.js             小工具（数字格式化等）

content/               内容脚本（注入 B站 页面）
  core/
    main.js            入口：读取配置、初始化各模块
    ui-engine.js       布局开关、夜间模式、模块调度
  modules/
    cleanup-engine.js   页面清理（广告/推荐等）
    cover-viewer.js     封面预览
    user-info-hover.js  UP 主信息悬浮卡
    video-info-hover.js 视频信息悬浮卡（简介 / AI 总结 / 热评）

inject/
  main-world-patch.js  注入 MAIN world 的补丁（评论区布局、IP 属地等）

styles/
  layout/              页面布局（global / header / home / search / video）
  features/            功能开关样式（隐藏首页推荐、热搜、相关推荐）
  components/          组件样式（两个悬浮卡、夜间模式）
```

样式按「布局 → 功能 → 组件」顺序在 `manifest.json` 里挂载，后面的可以覆盖前面的。

## 隐私策略 (Privacy Policy)

newB 不会收集个人数据。
