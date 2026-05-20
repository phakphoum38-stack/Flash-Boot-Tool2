console.log('preload loaded')
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  flashIso: (isoPath, device) => ipcRenderer.invoke('flash-iso', isoPath, device),
  
  onFlashProgress: (callback) => 
    ipcRenderer.on('flash-progress', (_, progress) => callback(progress)),
  
  onFlashError: (callback) => 
    ipcRenderer.on('flash-error', (_, error) => callback(error)),
  
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  selectIsoFile: () => ipcRenderer.invoke('select-iso'),
  
  getUsbDevices: () => ipcRenderer.invoke('get-usb-devices'),
  
  // เพิ่ม 3 ตัวนี้ให้ตรงกับปุ่ม Pause/Resume/Cancel
  cancelFlash: () => ipcRenderer.send('cancel-flash'),
  pauseFlash: () => ipcRenderer.send('pause-flash'),
  resumeFlash: () => ipcRenderer.send('resume-flash')
})
