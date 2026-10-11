# LifeOS Toast

每晚 21:00 的提醒：Siri / Apple Intelligence 式屏幕边缘光（宇宙色盘：30·30 绿 → 青 → 靛 → 紫 → 品红 → 粉，沿屏幕一圈缓慢流动），弹簧入场、停留、收回，4.5 秒后退出，再由脚本打开 Obsidian。

- 光效：`src/glow.js` 单个全屏 fragment shader。边缘光参考 [AppleIntelligenceGlowEffect](https://github.com/jacobamobin/AppleIntelligenceGlowEffect) 的多层叠加（细亮线 + 中/宽/环境三层衰减），发光线和入场弹簧参考 [glsl-playground](https://github.com/aaaa-zhen/glsl-playground)（Lorentzian `1/(d+t)`、欠阻尼弹簧 `1−e^(−λt)·cos(ωt)`）。
- 时间线在 `src/app.jsx` 的 `T`：弹簧入场 → 停留到 3.7s → 0.65s 收回 → 4.5s 退出。
- 窗口：`main.js` 开全屏透明、点击穿透、screen-saver 层级置顶、不抢焦点的窗口。渲染进程报错写到 `toast.log`。
- 由 Task Scheduler `LifeOSDailyReview` → `~/.claude/scripts/lifeos-daily-review.ps1` 调用：脚本先补齐本周天复盘，再运行本程序，退出后打开 `00 中控OS.base`。
- 改完运行 `npm run build`。预览：`node_modules\electron\dist\electron.exe .`（加 `--preview` 停留更久）。

## 试过又去掉的
- 右下角宇宙色晕染（shader 里 `uBloom` 代码还在，传 0 不画）：像一坨，太抢。
- 「Time to log」玻璃卡片：先用 liquid-glass-react，在 Windows Chromium 上多层错位、截图未模糊（透出背后窗口图标）、高光边粗；改成单层 CSS 毛玻璃 + desktopCapturer 垫底后干净了，但用户觉得卡片多余，整个去掉。
- 坑：GLSL 里 `half` 是保留字；React 19 的 render 是异步的，挂载后立刻量 DOM 会拿到 null。
