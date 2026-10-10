// LifeOS Toast — 21:00「Time to log」角标（Electron + liquid-glass-react）
// 1. 截下角标所在区域的屏幕，作为页面背景（这样 backdrop-filter 的玻璃折射才有东西可折射）
// 2. 无边框透明置顶窗口，不抢焦点、不挡鼠标
// 3. 页面动画结束后通知主进程：打开 Obsidian（--exe / --uri），然后退出
const { app, BrowserWindow, screen, desktopCapturer, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

const arg = name => (process.argv.find(a => a.startsWith(`--${name}=`)) || '').slice(name.length + 3);
const W = 214, H = 104, GAP = 4; // 窗口比卡片大，给玻璃边缘的折射和高光留位置

app.commandLine.appendSwitch('force-color-profile', 'srgb');

app.whenReady().then(async () => {
  const d = screen.getPrimaryDisplay();
  const sf = d.scaleFactor, wa = d.workArea;
  const x = wa.x + wa.width - W - GAP, y = wa.y + wa.height - H - GAP;

  let snapshot = '';
  try {
    const [src] = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: Math.round(d.bounds.width * sf), height: Math.round(d.bounds.height * sf) },
    });
    snapshot = src.thumbnail.crop({
      x: Math.round((x - d.bounds.x) * sf), y: Math.round((y - d.bounds.y) * sf),
      width: Math.round(W * sf), height: Math.round(H * sf),
    }).toDataURL();
  } catch (e) { /* 截图失败就退化成纯透明底 */ }

  const win = new BrowserWindow({
    x, y, width: W, height: H,
    frame: false, transparent: true, resizable: false, movable: false,
    alwaysOnTop: true, skipTaskbar: true, focusable: false, hasShadow: false, show: false,
    backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: false },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setIgnoreMouseEvents(true);

  ipcMain.handle('snapshot', () => snapshot);
  ipcMain.once('done', () => {
    const exe = arg('exe'), uri = arg('uri');
    if (uri) {
      const child = exe ? spawn(exe, [uri], { detached: true, stdio: 'ignore' })
                        : spawn('cmd', ['/c', 'start', '', uri], { detached: true, stdio: 'ignore' });
      child.unref();
    }
    app.quit();
  });

  await win.loadFile(path.join(__dirname, 'index.html'));
  win.showInactive();
  setTimeout(() => app.quit(), 15000); // 兜底
});
