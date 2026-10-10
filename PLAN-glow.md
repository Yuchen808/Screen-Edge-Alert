# 下一版：右下角宇宙色晕染 + 屏幕边缘 glow（Siri / Apple Intelligence 式）

用户要求（2026-10-10）：
- 右下角出现一团晕染，参考配色：中心 30·30 绿 #80EF80 → 外圈品红 / 紫（30·30 dark #2C1429 一系），宇宙 / 星云（cosmos）色盘
- 「Time to log」保持原位置（右下角，liquid glass 卡片）
- 同时渲染屏幕边缘 glow，像 iOS 18 Siri 唤醒的全局边缘光
- 标准：Apple level；先找 GitHub 上已有的好效果，学其 knowhow，再按本项目实现；每个细节打磨（曲线、时长、光的层次）
- 完成判据：打磨到 Apple level 的结果（截图 / 录屏）保存到桌面

已找到的参考（待读源码）：
- jacobamobin/AppleIntelligenceGlowEffect（325★，SwiftUI）：多层 stroke + 不同 blur 半径 + 随机角度渐变动画，有性能指南 PERFORMANCE_GUIDE.md
- aaaa-zhen/glsl-playground（70★）：「Apple's new Siri animation & Liquid Glass recreated in pure GLSL — single-file WebGL demos」→ 最接近，可直接移植到 Electron
- WillSuo-Github/Siri27SiriAnimation（SwiftUI + Metal）
- Lakr233/ColorfulX（475★，mesh gradient）、thelevicole/stripe-gradient（WebGL 网格渐变）

实现思路：
1. 全屏透明点击穿透 Electron 窗口（setIgnoreMouseEvents），WebGL/GLSL 画边缘 glow（多层：细亮边 + 中 blur + 大 blur 环境光，角度渐变缓慢旋转）
2. 右下角 radial bloom：绿核 + 品红外晕，噪声扰动，入场从角落扩散（ease-out ~900ms），呼吸 1 次后收拢
3. liquid glass 卡片在 bloom 上方出现（玻璃折射 bloom 颜色，更明显）
4. 退场：glow 先从边缘收回，卡片后淡出；然后 PS 打开 Obsidian（现有流程不变）
