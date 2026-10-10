const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('toast', {
  snapshot: () => ipcRenderer.invoke('snapshot'),
  done: () => ipcRenderer.send('done'),
});
