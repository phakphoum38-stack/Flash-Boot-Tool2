console.log('preload loaded')
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectIso: () => ipcRenderer.invoke('select-iso'),
  getUsbDevices: () => ipcRenderer.invoke('get-usb-devices'),
  flashIso: (mode, isoPath, device) => ipcRenderer.invoke('flash-iso', mode, isoPath, device),
  onFlashEvent: (callback) => ipcRenderer.on('flash-event', (_, data) => callback(data)),
  pauseFlash: () => ipcRenderer.send('pause-flash'),
  resumeFlash: () => ipcRenderer.send('resume-flash'),
  cancelFlash: () => ipcRenderer.send('cancel-flash'),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
})
