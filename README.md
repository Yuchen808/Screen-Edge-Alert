# LifeOS Toast

每晚 21:00「Time to log」：Siri 式屏幕边缘光（宇宙色盘）+ 单层 CSS 毛玻璃卡片（0.5px 发丝边 + 顶部镜面高光）。右下角晕染试过后去掉了（太抢、像一坨），shader 里 uBloom 代码保留未用，字体 Inter Display（OFL，见 `assets/Inter-LICENSE.txt`）。

- 光效：`src/glow.js` 单个全屏 fragment shader。边缘光参考 [AppleIntelligenceGlowEffect](https://github.com/jacobamobin/AppleIntelligenceGlowEffect) 的多层叠加，发光线和入场弹簧参考 [glsl-playground](https://github.com/aaaa-zhen/glsl-playground)（Lorentzian `1/(d+t)`、欠阻尼弹簧 `1−e^(−λt)·cos(ωt)`）。
- 时间线在 `src/app.jsx` 的 `T`：边缘光和晕染弹簧入场 → 卡片 380ms 弹出 → 停留 → 3.7s 起边缘光收回、晕染收拢成右下角光球、卡片淡出 → 4.5s 退出。
- 坑：卡片的淡入淡出不能放在祖先元素上（opacity/filter 会成为 backdrop root，玻璃看不到光效），所以写在 `#card > *` 每一层上；GLSL 里 `half` 是保留字。
- 渲染进程报错写到 `toast.log`。预览加长停留：`electron.exe . --preview`。

由 Task Scheduler `LifeOSDailyReview` → `~/.claude/scripts/lifeos-daily-review.ps1` 调用：脚本先补齐本周天复盘，再运行本角标（`electron.exe <本目录>`），角标播完退出后脚本打开 Obsidian 的 `00 中控OS.base`。

- 原理：Electron 透明窗口里 backdrop-filter 看不到桌面，所以 `main.js` 先用 `desktopCapturer` 截下卡片附近区域，渲染端只把卡片大小（同圆角）的一块垫在光效画布下面，卡片把「桌面 + 光效」一起模糊；卡片消失时截图同步撤掉。
- 曾用 liquid-glass-react：在 Windows Chromium 上位移层/边框层错位、截图未被模糊（透出背后窗口的图标）、高光边过粗，已弃用。
- 调参：`src/app.jsx`（折射强度、模糊、饱和度、圆角、停留时长）、`index.html`（字体、动画曲线）、`main.js`（窗口大小、离屏幕角落的距离）。
- 改完运行 `npm run build`，单独预览：`node_modules\electron\dist\electron.exe .`
