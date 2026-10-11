// LifeOS Toast — 21:00「Time to log」
// 全屏透明、点击穿透的窗口：WebGL 画屏幕边缘光 + 右下角宇宙色晕染，liquid-glass 卡片叠在晕染上。
// 玻璃要有东西可折射：先截下卡片所在区域的屏幕，铺在卡片正下方（在晕染图层之下）。
const { app, BrowserWindow, screen, desktopCapturer, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const CARD_GAP = { right: 111, bottom: 56 };   // 卡片中心离工作区右下角的距离（与上一版位置一致）
const CROP = { w: 300, h: 150 };                // 卡片下方截图区域

app.commandLine.appendSwitch('force-color-profile', 'srgb');

app.whenReady().then(async () => {
  const d = screen.getPrimaryDisplay();
  const sf = d.scaleFactor, b = d.bounds, wa = d.workArea;
  const card = { x: wa.x + wa.width - CARD_GAP.right - b.x, y: wa.y + wa.height - CARD_GAP.bottom - b.y };
  const crop = { x: card.x - CROP.w / 2, y: card.y - CROP.h / 2, w: CROP.w, h: CROP.h };

  let snapshot = '';
  try {
    const [src] = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: Math.round(b.width * sf), height: Math.round(b.height * sf) },
    });
    snapshot = src.thumbnail.crop({
      x: Math.round(crop.x * sf), y: Math.round(crop.y * sf),
      width: Math.round(crop.w * sf), height: Math.round(crop.h * sf),
    }).toDataURL();
  } catch (e) { /* 截图失败就只用晕染做底 */ }

  const win = new BrowserWindow({
    x: b.x, y: b.y, width: b.width, height: b.height,
    frame: false, transparent: true, resizable: false, movable: false, fullscreenable: false,
    alwaysOnTop: true, skipTaskbar: true, focusable: false, hasShadow: false, show: false,
    backgroundColor: '#00000000', enableLargerThanScreen: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: false },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setIgnoreMouseEvents(true);
  win.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height });

  ipcMain.handle('layout', () => ({ snapshot, card, crop, preview: process.argv.includes('--preview') }));
  ipcMain.once('done', () => app.quit());

  // 渲染进程的报错写进 toast.log，便于排查
  win.webContents.on('console-message', (_e, level, msg) => { if (level >= 2) fs.appendFileSync(path.join(__dirname, 'toast.log'), `${new Date().toISOString()} ${msg}
`); });
  await win.loadFile(path.join(__dirname, 'index.html'));
  win.showInactive();
  setTimeout(() => app.quit(), 20000); // 兜底
});
