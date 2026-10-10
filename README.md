# LifeOS Toast

每晚 21:00「Time to log」右下角角标：Apple Liquid Glass 质感（[liquid-glass-react](https://github.com/rdev/liquid-glass-react)），字体 Inter Display Medium（OFL，见 `assets/Inter-LICENSE.txt`）。

由 Task Scheduler `LifeOSDailyReview` → `~/.claude/scripts/lifeos-daily-review.ps1` 调用：脚本先补齐本周天复盘，再运行本角标（`electron.exe <本目录>`），角标播完退出后脚本打开 Obsidian 的 `00 中控OS.base`。

- 原理：Electron 透明无边框窗口无法看到桌面，所以 `main.js` 先用 `desktopCapturer` 截下角标所在区域作为页面背景，liquid-glass 的 backdrop-filter 折射这张截图，看起来就是叠在真实窗口上的玻璃。
- 调参：`src/app.jsx`（折射强度、模糊、饱和度、圆角、停留时长）、`index.html`（字体、动画曲线）、`main.js`（窗口大小、离屏幕角落的距离）。
- 改完运行 `npm run build`，单独预览：`node_modules\electron\dist\electron.exe .`
