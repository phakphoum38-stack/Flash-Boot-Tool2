const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  flashIso: (isoPath, device) => ipcRenderer.invoke('flash-iso', isoPath, device),
  onFlashProgress: (callback) => ipcRenderer.on('flash-progress', (_, progress) => callback(progress)),
  onFlashError: (callback) => ipcRenderer.on('flash-error', (_, error) => callback(error)),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
  selectIsoFile: () => ipcRenderer.invoke('select-iso-file')
});
