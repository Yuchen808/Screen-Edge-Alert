import { createGlow } from './glow.js';

// 只有 Siri 式屏幕边缘光：右下角晕染和「Time to log」卡片都试过后去掉了
// ---- 时间线（ms）----
const T = { holdUntil: 3700, out: 650, end: 4500 };

// 欠阻尼弹簧 1 − e^(−λt)·cos(ωt)：自然的轻微回弹（Siri 动画的入场曲线）
const spring = (t, l, w) => (t <= 0 ? 0 : 1 - Math.exp(-l * t) * Math.cos(w * t));
const easeInCubic = x => x * x * x;
const clamp01 = x => Math.min(1, Math.max(0, x));

(async () => { try {
  const L = await window.toast.layout();
  if (L.preview) { T.holdUntil = 9000; T.end = 9900; }
  const draw = createGlow(document.getElementById('glow'));

  let start = 0;
  const frame = now => {
    if (!start) start = now;
    const ms = now - start, s = ms / 1000;
    let edge = clamp01(spring(s, 5.0, 7.5));
    if (ms > T.holdUntil) edge *= 1 - easeInCubic(clamp01((ms - T.holdUntil) / T.out));
    draw({ time: s, edge, bloom: 0 });
    if (ms < T.end) requestAnimationFrame(frame);
    else { draw({ time: s, edge: 0, bloom: 0 }); window.toast.done(); }
  };
  requestAnimationFrame(frame);
} catch (e) { console.error('toast:', e && e.message); window.toast.done(); } })();
