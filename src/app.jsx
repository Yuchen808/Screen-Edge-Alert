import { createRoot } from 'react-dom/client';
import LiquidGlass from 'liquid-glass-react';
import { createGlow } from './glow.js';

// ---- 时间线（ms）----
const T = { bloomDelay: 80, cardIn: 380, holdUntil: 3700, out: 650, end: 4500 };

// 欠阻尼弹簧 1 − e^(−λt)·cos(ωt)：自然的轻微回弹（Siri 动画的入场曲线）
const spring = (t, l, w) => (t <= 0 ? 0 : 1 - Math.exp(-l * t) * Math.cos(w * t));
const easeInCubic = x => x * x * x;
const clamp01 = x => Math.min(1, Math.max(0, x));

function Card({ card }) {
  return (
    <LiquidGlass
      mode="standard"
      displacementScale={60}
      blurAmount={0.08}
      saturation={150}
      aberrationIntensity={1.8}
      elasticity={0}
      cornerRadius={14}
      padding="0"
      style={{ position: 'fixed', top: `${card.y}px`, left: `${card.x}px` }}
    >
      <div className="label">Time to log</div>
    </LiquidGlass>
  );
}

(async () => { try {
  const L = await window.toast.layout();
  if (L.preview) { T.holdUntil = 9000; T.end = 9900; }

  const snap = document.getElementById('snap');
  Object.assign(snap.style, { left: `${L.crop.x}px`, top: `${L.crop.y}px`, width: `${L.crop.w}px`, height: `${L.crop.h}px` });
  if (L.snapshot) snap.style.backgroundImage = `url(${L.snapshot})`;

  // 卡片的淡入淡出只能作用在玻璃元素自身：祖先上的 opacity/filter 会变成 backdrop root，玻璃就看不到下面的光效
  const cardLayer = document.getElementById('card');
  const rootStyle = document.documentElement.style;
  createRoot(cardLayer).render(<Card card={L.card} />);

  const draw = createGlow(document.getElementById('glow'));
  await document.fonts.ready;

  let start = 0;
  const frame = now => {
    if (!start) start = now;
    const ms = now - start, s = ms / 1000;

    let edge = clamp01(spring(s, 5.0, 7.5));
    let bloom = spring(Math.max(0, (ms - T.bloomDelay) / 1000), 4.6, 5.4);
    if (ms > T.holdUntil) {
      const k = easeInCubic(clamp01((ms - T.holdUntil) / T.out));
      edge *= 1 - k;
      bloom *= 1 - k;                                   // 晕染整体收回右下角尖
    }
    draw({ time: s, edge, bloom: Math.max(0, bloom) });

    // 卡片：弹簧放大 + 淡入；退场时缩小淡出
    const ci = (ms - T.cardIn) / 1000;
    let co = clamp01(ci / 0.45), cs = 0.9 + 0.1 * spring(ci, 6.5, 9.0);
    if (ms > T.holdUntil - 80) {
      const k = clamp01((ms - T.holdUntil + 80) / 540);
      co *= 1 - easeInCubic(k); cs -= 0.05 * k;
    }
    rootStyle.setProperty('--card-o', co.toFixed(3));
    rootStyle.setProperty('--card-s', Math.max(0, cs).toFixed(4));
    snap.style.opacity = co.toFixed(3);                 // 截图只在卡片可见时垫底，否则是一块冻住的旧画面

    if (ms < T.end) requestAnimationFrame(frame);
    else { draw({ time: s, edge: 0, bloom: 0 }); window.toast.done(); }
  };
  requestAnimationFrame(frame);
} catch (e) { console.error('toast:', e && e.message); window.toast.done(); } })();
