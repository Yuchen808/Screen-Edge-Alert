import { createRoot } from 'react-dom/client';
import LiquidGlass from 'liquid-glass-react';

const HOLD = 2600; // 完全显示后停留
const stage = document.getElementById('stage');

function Toast() {
  return (
    <LiquidGlass
      mode="standard"
      displacementScale={56}
      blurAmount={0.06}
      saturation={140}
      aberrationIntensity={1.6}
      elasticity={0}
      cornerRadius={14}
      padding="17px 30px"
      style={{ position: 'fixed', top: '50%', left: '50%' }}
    >
      <div className="label">Time to log</div>
    </LiquidGlass>
  );
}

(async () => {
  const snap = await window.toast.snapshot();
  if (snap) stage.style.backgroundImage = `url(${snap})`;
  createRoot(document.getElementById('root')).render(<Toast />);
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    stage.classList.add('in');
    setTimeout(() => {
      stage.classList.remove('in'); stage.style.opacity = 1; stage.classList.add('out');
      setTimeout(() => window.toast.done(), 560);
    }, 720 + HOLD);
  }));
})();
