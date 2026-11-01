# Changelog

本项目所有值得注意的变更都会记录在这里，格式参考 Keep a Changelog。

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
