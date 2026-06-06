import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {

  // =========================
  // ISO
  // =========================
  selectIso: () =>
    ipcRenderer.invoke('select-iso'),

  // =========================
  // USB
  // =========================
  getUsbDevices: () =>
    ipcRenderer.invoke('get-usb-devices'),

  // =========================
  // FLASH
  // =========================
  flashIso: (mode, isoPath, device) =>
    ipcRenderer.invoke('flash-iso', mode, isoPath, device),

  // =========================
  // EVENTS
  // =========================
  onFlashEvent: (callback) => {

    const handler = (_event, data) => {
      callback(data)
    }

    ipcRenderer.on('flash-event', handler)

    return () => {
      ipcRenderer.removeListener('flash-event', handler)
    }
  },

  // =========================
  // CONTROL
  // =========================
  cancelFlash: () =>
    ipcRenderer.invoke('cancel-flash')
})
