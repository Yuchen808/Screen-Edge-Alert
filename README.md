# Screen Edge Alert

屏幕边缘光提醒，Siri / Apple Intelligence 那种效果：屏幕四边亮起一圈流动的光，带一点弹簧回弹，停留一会儿后收回，然后程序自动退出。窗口全屏透明、点击穿透、不抢焦点，打字和点击都不受影响。Windows 和 macOS 都能用。

默认配色是宇宙色盘：30·30 绿 → 青 → 靛 → 紫 → 品红 → 粉，沿屏幕一圈缓慢流动。另有 `alert`（红橙粉）、`calm`（蓝紫）、`focus`（绿）、`okr`（暖光：奶油 → 琥珀 → 血橙 → 焦糖）四个预设，也可以传 1–6 个自定义颜色。

## 安装

需要 Node.js 18 以上。

```bash
git clone https://github.com/Yuchen808/Screen-Edge-Alert.git
cd Screen-Edge-Alert
npm install
npm run build
```

## 使用

**macOS / Linux**

```bash
./scripts/edge-glow.sh                       # 默认宇宙色盘，约 4.5 秒
./scripts/edge-glow.sh -p alert -H 6000      # 预设 cosmos / alert / calm / focus / okr；6 秒时开始收回
./scripts/edge-glow.sh -c 80EF80,7C8CFF -n   # 自定义 1–6 色（逗号分隔的 hex）；-n 表示不等播完就返回
```

**Windows（PowerShell）**

```powershell
.\scripts\edge-glow.ps1
.\scripts\edge-glow.ps1 -Preset alert -Hold 6000
.\scripts\edge-glow.ps1 -Colors '#80EF80','#7C8CFF' -NoWait
```

**直接调用程序**

```bash
npx electron . --hold=3700 --colors=80EF80,7C8CFF   # 加 --preview 会停留 9 秒，方便调参
```

`--hold` 是开始收回的时刻（毫秒），程序在 hold + 800ms 时退出。

## 定时提醒

- **macOS**：用 launchd，在 `~/Library/LaunchAgents/` 里放一个 plist，按 `StartCalendarInterval` 定时运行 `scripts/edge-glow.sh`。也可以用 Shortcuts（快捷指令）的「运行 Shell 脚本」。
- **Windows**：用 Task Scheduler，登录类型选 Interactive，运行 `powershell -File scripts\edge-glow.ps1`。

提醒结束后要打开某个 App 或文件，就把那条命令写在脚本后面。默认会等光效播完才返回，不需要加 `-n`/`-NoWait`。

## 原理

- `src/glow.js` 是一个全屏 fragment shader。光由四层叠成：一条 Lorentzian `1/(d+t)` 细亮线，加中、宽、环境三层指数衰减。距离用圆角矩形 SDF 算到屏幕边，颜色按角度在色盘里流动。输出是预乘 alpha，经过软 tone-map 并加抖动，避免色带。
- `src/app.js` 管时间线：欠阻尼弹簧 `1 − e^(−λt)·cos(ωt)` 入场，停留到 `--hold`，再用 easeInCubic 收回。
- `main.js` 开窗口：透明、无边框、点击穿透、screen-saver 层级置顶、不抢焦点。macOS 上会隐藏 Dock 图标，并设置在所有桌面和全屏 App 上可见。渲染报错写到 `toast.log`。

参考：[AppleIntelligenceGlowEffect](https://github.com/jacobamobin/AppleIntelligenceGlowEffect) 的多层叠加，[glsl-playground](https://github.com/aaaa-zhen/glsl-playground) 的发光线和弹簧曲线。

## 试过又去掉的

- 右下角的宇宙色晕染：太抢，像一大坨。`glow.js` 里 `uBloom` 那段代码还在，传 0 就不画。
- 「Time to log」玻璃卡片：liquid-glass-react 在 Windows Chromium 上几层对不齐，高光边也粗。换成单层 CSS 毛玻璃之后干净了，但卡片本身是多余的。
- 坑：GLSL 里 `half` 是保留字；`backdrop-filter` 元素的祖先上不能放 opacity/filter，否则会变成 backdrop root。
