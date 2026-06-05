import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {

  // ======================
  // ISO
  // ======================
  selectIso: () =>
    ipcRenderer.invoke('select-iso'),

  // ======================
  // USB
  // ======================
  getUsbDevices: () =>
    ipcRenderer.invoke('get-usb-devices'),

  // ======================
  // FILE SIZE
  // ======================
  getFileSize: (filePath: string) =>
    ipcRenderer.invoke('get-file-size', filePath),

  // ======================
  // FLASH
  // ======================
  flashIso: (
    mode: string,
    isoPath: string,
    device: string
  ) =>
    ipcRenderer.invoke(
      'flash-iso',
      mode,
      isoPath,
      device
    ),

  // ======================
  // EVENTS
  // ======================
  onFlashEvent: (callback: any) => {

    const handler = (
      _: any,
      data: any
    ) => callback(data)

    ipcRenderer.on(
      'flash-event',
      handler
    )

    return () =>
      ipcRenderer.removeListener(
        'flash-event',
        handler
      )
  },

  // ======================
  // PAUSE
  // ======================
  pauseFlash: () =>
    ipcRenderer.send('pause-flash'),

  // ======================
  // RESUME
  // ======================
  resumeFlash: () =>
    ipcRenderer.send('resume-flash'),

  // ======================
  // CANCEL
  // ======================
  cancelFlash: () =>
    ipcRenderer.invoke('cancel-flash')
})
