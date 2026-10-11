// LifeOS Toast — 21:00「Time to log」
// 全屏透明、点击穿透的窗口：WebGL 画 Siri 式屏幕边缘光（宇宙色盘），播完退出。
const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');


app.commandLine.appendSwitch('force-color-profile', 'srgb');

app.whenReady().then(async () => {
  const d = screen.getPrimaryDisplay();
  const b = d.bounds;

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

  ipcMain.handle('layout', () => ({ preview: process.argv.includes('--preview') }));
  ipcMain.once('done', () => app.quit());

  // 渲染进程的报错写进 toast.log，便于排查
  win.webContents.on('console-message', (_e, level, msg) => { if (level >= 2) fs.appendFileSync(path.join(__dirname, 'toast.log'), `${new Date().toISOString()} ${msg}
`); });
  await win.loadFile(path.join(__dirname, 'index.html'));
  win.showInactive();
  setTimeout(() => app.quit(), 20000); // 兜底
});
