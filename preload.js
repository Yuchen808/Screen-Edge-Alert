const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('toast', {
  layout: () => ipcRenderer.invoke('layout'),
  done: () => ipcRenderer.send('done'),
});
