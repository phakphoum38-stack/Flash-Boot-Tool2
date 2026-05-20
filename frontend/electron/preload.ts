import { contextBridge, ipcRenderer } from 'electron'

type FlashEvent = 
  | { type: 'progress', value: number, written: number, total: number }
  | { type: 'log', level: string, msg: string }
  | { type: 'result', success: boolean, msg?: string }
  | { type: 'error', msg: string }

contextBridge.exposeInMainWorld('electron', {
  flashIso: (mode: string, isoPath: string, device: string) => 
    ipcRenderer.invoke('flash-iso', mode, isoPath, device),
  
  onFlashEvent: (callback: (event: FlashEvent) => void) => {
    const handler = (_: any, event: FlashEvent) => callback(event)
    ipcRenderer.on('flash-event', handler)
    return () => ipcRenderer.removeListener('flash-event', handler)
  },
  
  selectIsoFile: () => ipcRenderer.invoke('select-iso'),
  getUsbDevices: () => ipcRenderer.invoke('get-usb-devices')
})

contextBridge.exposeInMainWorld('electron', {
  flashIso: (mode: string, isoPath: string, device: string) =>
    ipcRenderer.invoke('flash-iso', mode, isoPath, device),

  onFlashEvent: (callback) => {
    const handler = (_: any, event) => callback(event)
    ipcRenderer.on('flash-event', handler)
    return () => ipcRenderer.removeListener('flash-event', handler)
  },

  selectIsoFile: () => ipcRenderer.invoke('select-iso'),
  getUsbDevices: () => ipcRenderer.invoke('get-usb-devices'),
  getFileSize: (path: string) => ipcRenderer.invoke('get-file-size', path)
})
