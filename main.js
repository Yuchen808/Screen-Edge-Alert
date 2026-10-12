// Screen Edge Alert — 全局提醒：Siri 式屏幕边缘光，播完自动退出。Windows / macOS 通用。
// 全屏透明、点击穿透、不抢焦点的窗口，WebGL 画边缘光。
const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');


app.commandLine.appendSwitch('force-color-profile', 'srgb');
if (process.platform === 'darwin') app.dock?.hide();            // macOS：不在 Dock 里闪一个图标

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
  if (process.platform === 'darwin') win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });   // 所有桌面、全屏 App 上都显示
  win.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height });

  const arg = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || '').slice(k.length + 3);
  const colors = arg('colors').split(',').map(c => c.trim()).filter(c => /^#?[0-9a-f]{6}$/i.test(c)).map(c => c.replace(/^#?/, '#'));
  ipcMain.handle('layout', () => ({ preview: process.argv.includes('--preview'), hold: Number(arg('hold')) || 0, colors }));
  ipcMain.once('done', () => app.quit());

  // 渲染进程的报错写进 toast.log，便于排查
  win.webContents.on('console-message', (_e, level, msg) => { if (level >= 2) fs.appendFileSync(path.join(__dirname, 'toast.log'), `${new Date().toISOString()} ${msg}
`); });
  await win.loadFile(path.join(__dirname, 'index.html'));
  win.showInactive();
  setTimeout(() => app.quit(), 20000); // 兜底
});
