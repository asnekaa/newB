# Changelog

本项目所有值得注意的变更都会记录在这里，格式参考 Keep a Changelog。

## [0.6.0](https://github.com/asnekaa/newB/compare/newB-v0.5.0...newB-v0.6.0) (2026-11-11)


### Features

* add toggle switches for each filter ([540dd3a](https://github.com/asnekaa/newB/commit/540dd3aa96e35616b923b94ac04d42f3fa6ee006))
* remove video CDN optimization feature ([3daa0de](https://github.com/asnekaa/newB/commit/3daa0de454898ae720fdf0a44239ec0f778c0c55))
* **ui:** add independent toggle to hide homepage video feed ([5235f4e](https://github.com/asnekaa/newB/commit/5235f4e7f397e508c205957f1e4fbf9edad489ff))
* UP 主悬浮卡显示 UID 并支持点击复制 ([1173307](https://github.com/asnekaa/newB/commit/1173307c07d0ba1851345f5e74896fdf7859218d))
* 动态页视频悬浮卡显示在目标左侧 ([d8814ac](https://github.com/asnekaa/newB/commit/d8814acd91fcb80fcd90db7d3958724aacbfefc7))
* 封面悬停打开独立预览播放器（声音/弹幕/进度条） ([5e7dbb0](https://github.com/asnekaa/newB/commit/5e7dbb04b76bdce977ad79876cfe791273fd01d5))
* 悬浮卡片显示评论图片 ([8b45d4f](https://github.com/asnekaa/newB/commit/8b45d4f74a47d3bc4590af89d895e8bc00717856))
* 新增 Konami 弹幕雨彩蛋，移除设置页打乱开关的旧彩蛋 ([9564005](https://github.com/asnekaa/newB/commit/95640053b67fe3391e445224c30a4ae53eb96f7d))
* 热评不再标「热评」，UP 主本人的评论标 UP ([029ed33](https://github.com/asnekaa/newB/commit/029ed331f386ed2efdcf49e29f1409ff734dfe83))
* 视频悬浮卡显示两条评论（有置顶则置顶加热评，否则两条热评） ([a0593d5](https://github.com/asnekaa/newB/commit/a0593d533aaa5c10f4a10926aa9e9b2be5a3f1b9))
* 视频悬浮卡显示多 P 视频的分 P 数 ([184f596](https://github.com/asnekaa/newB/commit/184f596fd1518e17fce64827c450cae86d6a4a53))
* 视频悬浮卡统计栏新增评论数 ([e989374](https://github.com/asnekaa/newB/commit/e98937430469d077f9d308dbeb52b04b55b5c691))
* 设置页左上角显示当前版本号 ([f7b2a19](https://github.com/asnekaa/newB/commit/f7b2a19a5e1a2346ff32d7ccd88d66a262c9b4d6))
* 评论下方再显示一条楼中楼热评 ([5b3ed66](https://github.com/asnekaa/newB/commit/5b3ed66dad63fac1e458387c8cda58e9a74a8af4))
* 评论图片不再限制 3 张，改为四列网格展示全部 ([c5005d3](https://github.com/asnekaa/newB/commit/c5005d3e5ee358da341d020cbf3ff7fce14e084f))
* 评论图片点击改为页内放大预览 ([2c5c2de](https://github.com/asnekaa/newB/commit/2c5c2de840ee20477be69e6d6ef28208e7fcd9dd))
* 预览弹幕按 bpx_player_profile.dmSetting 应用 B站 弹幕设置 ([a3ff9f2](https://github.com/asnekaa/newB/commit/a3ff9f2704a97235b54d52474874e3c7b4a5a074))
* 预览播放器支持拖动和缩放 ([3cd3d51](https://github.com/asnekaa/newB/commit/3cd3d5112c1fc49a6604d14d3c3c0f1263f5027f))
* 预览播放器支持画中画 ([33034cc](https://github.com/asnekaa/newB/commit/33034cc79f87e5783e2bdecb6006b3cc5b4ec4ba))
* 预览播放器默认放左侧，弹幕读取 B站 播放器设置 ([15a164e](https://github.com/asnekaa/newB/commit/15a164e392d8602048041e89414780c3831b3440))
* 预览窗四角缩放；默认宽度由视频分辨率决定 ([cd5dbd0](https://github.com/asnekaa/newB/commit/cd5dbd08e63d9aeea13f4bd00deee79615f3549d))


### Bug Fixes

* AI 与热评改为槽位局部更新，避免二次整卡重绘闪烁 ([6f240af](https://github.com/asnekaa/newB/commit/6f240af6b41711b5d23e6d20f6dbbc9c8e6bebab))
* **config:** prevent ghost data retention in exported configuration ([7c36b5d](https://github.com/asnekaa/newB/commit/7c36b5d88e9659c325d452e85c9543af962d1dff))
* **config:** purge deprecated 'optimizeCdn' field from local storage ([6e08db9](https://github.com/asnekaa/newB/commit/6e08db9a5abfa3d6921649040b9f95bee7f10193))
* **css:** enhance header styles for search layout in day and night modes ([a23773b](https://github.com/asnekaa/newB/commit/a23773bbe6f3215309ee7f80112769d169ea4557))
* **css:** keep homepage refresh button ([75da6ff](https://github.com/asnekaa/newB/commit/75da6ffbb5b5721400c50cf0919557b985018238))
* **css:** scope hide-recommend selectors to prevent hiding homepage video feed ([5742647](https://github.com/asnekaa/newB/commit/57426477417a724ede444fb0faf10647102ad865))
* **manifest:** reorder JavaScript files in content_scripts section ([936ea91](https://github.com/asnekaa/newB/commit/936ea91f05484f251ca7ee91bac99d68195ba015))
* **popup.css:** 将日志区域的固定高度改为最大高度 ([16575b4](https://github.com/asnekaa/newB/commit/16575b41cb192fbe3a5d3d9183c6c6b0ee62c234))
* **popup:** resolve night mode dropdown bug and fix hover delay layout ([cf4c4a1](https://github.com/asnekaa/newB/commit/cf4c4a11f0f185930a588cef7812aaa6d107a6d1))
* **popup:** simplify label text for cover viewer display ([c47a4b3](https://github.com/asnekaa/newB/commit/c47a4b385c6556167fb5f1012a7239624786302b))
* **styles:** apply dark mode to global footer ([f0be835](https://github.com/asnekaa/newB/commit/f0be835361fbf4c847c103d4dac9eb593e035d1c))
* **styles:** center search bar in header ([efcc833](https://github.com/asnekaa/newB/commit/efcc833c85ef74d605af5e02b78479295d2ab26d))
* **styles:** dark mode for article pages ([e6c5478](https://github.com/asnekaa/newB/commit/e6c5478f8ce100c11282908ed64c6e56d548052d))
* **styles:** fix UP name color in article dark mode ([1720e6e](https://github.com/asnekaa/newB/commit/1720e6e99c0b8b1aaf5ec54640fbce64c75fd96b))
* **styles:** remove unused styles for "not interested" popover UI ([70386cf](https://github.com/asnekaa/newB/commit/70386cf1c08ad2cf5f20df3b6dc891593122fc20))
* **styles:** scope article UP info in dark mode ([9de313f](https://github.com/asnekaa/newB/commit/9de313f353ad7ec57b244cced3ec5450868a926c))
* **styles:** scope generic `.container` class to `.bili-feed4` to prevent layout breakage on article list pages ([8850723](https://github.com/asnekaa/newB/commit/8850723ed5edad42b50969c2bfbcacfae7b77ede))
* **styles:** standardize comment formatting in CSS files ([cbdf6d4](https://github.com/asnekaa/newB/commit/cbdf6d42af6557b904291a2f83ba176fb25980ff))
* UID 复制改为行内提示，等级改用文字徽章，移除未使用雪碧图 ([feb9544](https://github.com/asnekaa/newB/commit/feb9544903dd86e615b5dd65c9a968b09cb84f5a))
* 修复 view/detail 自带 Reply 导致的空 content 崩溃 ([aa556a5](https://github.com/asnekaa/newB/commit/aa556a5dcf77f42a09547f200ee521fd8d782969))
* 动态页 UP 名不是链接时沿祖先找 space 链接解析 mid ([10b4c16](https://github.com/asnekaa/newB/commit/10b4c1664f053fa1a7be5dde77f200ff6e8f8a94))
* 动态页 UP 悬浮窗闪现即消失，补 mid 解析与移出守卫 ([755e2c1](https://github.com/asnekaa/newB/commit/755e2c1a3e7790222c35ae5af1a03b5c5d80103b))
* 动态页不再隐藏 B站 原生用户卡 ([f87d2a5](https://github.com/asnekaa/newB/commit/f87d2a58f6a351e52da0c5b21bd3d864673b550e))
* 动态页交还原生用户卡，恢复其它页面悬浮卡显示/隐藏逻辑 ([8422cc2](https://github.com/asnekaa/newB/commit/8422cc2af26b76e540bbb1598634afb955666e60))
* 动态页从头像的 bilisponsor-userid 属性解析 UP mid ([cd35720](https://github.com/asnekaa/newB/commit/cd35720f98c7f7f2449909abe1f3e5393558327a))
* 去掉窗口四角的缩放箭头标记，恢复四角缩放光标 ([60d9427](https://github.com/asnekaa/newB/commit/60d9427907fb2f5db16ab85b3bc4f24959217bf2))
* 只有 chore 类提交时不再误发 patch 版本 ([faf9976](https://github.com/asnekaa/newB/commit/faf9976bba648991733de308600a60b0c2d59c36))
* 展开长文时悬浮卡片不再超出屏幕 ([fc7fd40](https://github.com/asnekaa/newB/commit/fc7fd4082ac0a9dd56c79ea1976ef0c0b05d798b))
* 弹幕改为从右向左的显式 transform 动画 ([47ca0f8](https://github.com/asnekaa/newB/commit/47ca0f83899f3fe715af1b71949cc24b26151f70))
* 弹幕雨改为从左到右、取视频真实弹幕、仅视频页触发，提示改成点击版本号显示 ([a8d3f8c](https://github.com/asnekaa/newB/commit/a8d3f8cc3b7e64ec3a6122a357345707eed8515b))
* 彩蛋弹幕恢复从右向左 ([faffe99](https://github.com/asnekaa/newB/commit/faffe995fd60029e7597d90a4ffeb1e8e917fca7))
* 彩蛋提示补全箭头序列；去掉固定弹幕、放慢速度、无弹幕不触发；版本号悬停不变色 ([d46bdbc](https://github.com/asnekaa/newB/commit/d46bdbcc6cac0172d3800daba981e64abb8a407f))
* 恢复等级雪碧图裁切（修正 preserveAspectRatio 导致的错位），UID 悬停不再变色 ([0bacbd6](https://github.com/asnekaa/newB/commit/0bacbd6f6ef9d577007da57bd0f891ffa0e0d31b))
* 悬浮卡片优先显示置顶评论 ([0028f96](https://github.com/asnekaa/newB/commit/0028f960a07056fab5eb08402904623aad761434))
* 悬浮卡片请求加超时与缓存，先渲染基础信息再补 AI/热评 ([c66eadb](https://github.com/asnekaa/newB/commit/c66eadb3563245a3fbe1c6c35833aa1ae5a359ab))
* 打包补上 manifest.json，去掉 LICENSE/README ([d85b0bc](https://github.com/asnekaa/newB/commit/d85b0bc90b2e576cc70435de1cc356227c4f2afd))
* 拖动播放器不改光标，每次重新显示恢复默认位置和大小 ([2ece1ea](https://github.com/asnekaa/newB/commit/2ece1ead7c30c0a740461546d44867ece8b710d6))
* 拖动预览窗口时不再改变鼠标指针 ([b64fc40](https://github.com/asnekaa/newB/commit/b64fc40981e2c7b6f0107e79aa2437bb188891ca))
* 楼中楼点赞数移到行末右对齐 ([ef519c6](https://github.com/asnekaa/newB/commit/ef519c672d63cf4c01ae68a90af2df08ee87cc41))
* 深色模式视频卡片 UP 行 hover 统一变蓝 ([bf29b99](https://github.com/asnekaa/newB/commit/bf29b99095933c88d8f6bdf8019481e573ab38be))
* 清理 video-info-hover.css 冗余代码并修复语法错误 ([463119f](https://github.com/asnekaa/newB/commit/463119f6f9c7a70a75c5c067d45f1a7465fa0fc4))
* 热评始终显示「热评」并叠加 UP 标；悬浮卡内容变高后重新定位避免超出屏幕 ([5588afa](https://github.com/asnekaa/newB/commit/5588afa265773ed565efc87dd1ed2c24f15d3e91))
* 热评恢复「热评」标签，UP 主的评论仍标 UP ([215ef27](https://github.com/asnekaa/newB/commit/215ef27be36e72606e9c691d4d7626cbc1b29ab9))
* 硬核会员显示 LV6 闪电徽章；修复封面点击双开；深色模式恢复作者名 hover 变蓝 ([9320d28](https://github.com/asnekaa/newB/commit/9320d28527b5c3ac95d9ae078d2f506c99c03a5f))
* 移除画中画按钮，关闭按钮仅悬停显示，弹幕接口加兜底 ([501bf32](https://github.com/asnekaa/newB/commit/501bf32fabfdd17418967533c0a86174149d90c7))
* 缩放不再改光标；请求最高清晰度；默认窗口按 480P 尺寸 ([6b817d1](https://github.com/asnekaa/newB/commit/6b817d168dc7d8faa83fd719d34f766f31168270))
* 评论图片按原始比例显示，不再裁成正方形 ([86d8241](https://github.com/asnekaa/newB/commit/86d8241431fef82f60725985682f9359450f0c0e))
* 请求超时改用 AbortController，失败时显示具体原因 ([f734eb3](https://github.com/asnekaa/newB/commit/f734eb3ddb87753a71f084ccd875b3c959f21033))
* 预览画质默认 720P ([a39ac08](https://github.com/asnekaa/newB/commit/a39ac080f01faba1dc147db72f489856dc21eb28))
* 预览窗层级高于信息悬浮卡；清晰度请求 720P ([8211502](https://github.com/asnekaa/newB/commit/8211502c0ee63958d8996b17071511b42bc29f7c))
* 默认窗口按 360P；仅在拖动/缩放时切换光标 ([e50a7c1](https://github.com/asnekaa/newB/commit/e50a7c177d541b10bee31a103caf53208b2536b1))

## [0.5.0] - 2026-11-10

### 新增

- 动态页视频悬浮卡显示在目标左侧
- 评论图片不再限制 3 张，改为四列网格展示全部
- 评论下方再显示一条楼中楼热评
- 热评不再标「热评」，UP 主本人的评论标 UP
- 视频悬浮卡显示两条评论（有置顶则置顶加热评，否则两条热评）

### 修复

- 动态页不再隐藏 B站 原生用户卡
- 动态页交还原生用户卡，恢复其它页面悬浮卡显示/隐藏逻辑
- 动态页从头像的 bilisponsor-userid 属性解析 UP mid
- 动态页 UP 名不是链接时沿祖先找 space 链接解析 mid
- 动态页 UP 悬浮窗闪现即消失，补 mid 解析与移出守卫
- 评论图片按原始比例显示，不再裁成正方形
- 楼中楼点赞数移到行末右对齐
- 热评恢复「热评」标签，UP 主的评论仍标 UP

### 其他

- chore: 发版脚本同步更新 release-please 基线，避免重复提议版本
- chore: 非规范提交在变更日志里也加列表前缀
- Revert "chore: 变更日志只记录 feat/fix，并跳过发布与已回滚的提交"
- chore: 变更日志只记录 feat/fix，并跳过发布与已回滚的提交

## [0.4.3] - 2026-11-01

### 新增

- 新增 Konami 弹幕雨彩蛋，移除设置页打乱开关的旧彩蛋
- 设置页左上角显示当前版本号

### 修复

- 打包补上 manifest.json，去掉 LICENSE/README
- 彩蛋提示补全箭头序列；去掉固定弹幕、放慢速度、无弹幕不触发；版本号悬停不变色
- 弹幕雨改为从左到右、取视频真实弹幕、仅视频页触发，提示改成点击版本号显示
- 只有 chore 类提交时不再误发 patch 版本

### 其他

- chore: 0.4.4
- chore: 0.4.3
Revert "ci: 1.0 之前 feat 只升 patch，避免小改动跳到 0.x.0"
- ci: 1.0 之前 feat 只升 patch，避免小改动跳到 0.x.0
- ci: 修复 tag 触发时 zip 未上传的问题
- chore: 0.5.0
- ci: 改用自带脚本算版本，去掉 release-please 与 PR 权限依赖
- ci: 接入 release-please，按提交自动算版本并生成 CHANGELOG
