import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { createGlow } from './glow.js';

// ---- 时间线（ms）----
const T = { bloomDelay: 80, cardIn: 380, holdUntil: 3700, out: 650, end: 4500 };

// 欠阻尼弹簧 1 − e^(−λt)·cos(ωt)：自然的轻微回弹（Siri 动画的入场曲线）
const spring = (t, l, w) => (t <= 0 ? 0 : 1 - Math.exp(-l * t) * Math.cos(w * t));
const easeInCubic = x => x * x * x;
const clamp01 = x => Math.min(1, Math.max(0, x));

// 单层玻璃卡片：backdrop-filter 只模糊/提饱和身后的光效画布（同一窗口内），不再截屏、不做位移折射——
// liquid-glass-react 在 Windows Chromium 上多层错位、截图冻结，边缘粗糙
function Card({ card }) {
  return <div className="glass" style={{ left: `${card.x}px`, top: `${card.y}px` }}>Time to log</div>;
}

(async () => { try {
  const L = await window.toast.layout();
  if (L.preview) { T.holdUntil = 9000; T.end = 9900; }

  // 卡片的淡入淡出只能作用在玻璃元素自身：祖先上的 opacity/filter 会变成 backdrop root，玻璃就看不到下面的光效
  const cardLayer = document.getElementById('card');
  const rootStyle = document.documentElement.style;
  const root = createRoot(cardLayer);
  flushSync(() => root.render(<Card card={L.card} />));   // 同步挂载，后面要量卡片尺寸

  const draw = createGlow(document.getElementById('glow'));
  await document.fonts.ready;

  // 截图只铺卡片那么大（圆角一致），卡片外面看到的是真实桌面
  const snap = document.getElementById('snap');
  const g = cardLayer.firstElementChild;
  if (L.snapshot && g) {
    const w = g.offsetWidth, h = g.offsetHeight;
    const x = L.card.x - w / 2, y = L.card.y - h / 2;
    Object.assign(snap.style, {
      left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`,
      backgroundImage: `url(${L.snapshot})`, backgroundSize: `${L.crop.w}px ${L.crop.h}px`,
      backgroundPosition: `${L.crop.x - x}px ${L.crop.y - y}px`,
    });
  }


  let start = 0;
  const frame = now => {
    if (!start) start = now;
    const ms = now - start, s = ms / 1000;

    let edge = clamp01(spring(s, 5.0, 7.5));
    if (ms > T.holdUntil) {
      const k = easeInCubic(clamp01((ms - T.holdUntil) / T.out));
      edge *= 1 - k;
    }
    draw({ time: s, edge, bloom: 0 });                    // 右下角晕染已去掉（用户：一大坨太怪），只留屏幕边缘光

    // 卡片：弹簧放大 + 淡入；退场时缩小淡出
    const ci = (ms - T.cardIn) / 1000;
    let co = clamp01(ci / 0.45), cs = 0.9 + 0.1 * spring(ci, 6.5, 9.0);
    if (ms > T.holdUntil - 80) {
      const k = clamp01((ms - T.holdUntil + 80) / 540);
      co *= 1 - easeInCubic(k); cs -= 0.05 * k;
    }
    rootStyle.setProperty('--card-o', co.toFixed(3));
    rootStyle.setProperty('--card-s', Math.max(0, cs).toFixed(4));
    snap.style.opacity = co > 0.001 ? '1' : '0';          // 卡片在时才垫截图（被模糊，看不出冻结）

    if (ms < T.end) requestAnimationFrame(frame);
    else { draw({ time: s, edge: 0, bloom: 0 }); window.toast.done(); }
  };
  requestAnimationFrame(frame);
} catch (e) { console.error('toast:', e && e.message); window.toast.done(); } })();
