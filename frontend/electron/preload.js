const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  selectIso: () => ipcRenderer.invoke("select-iso"),

  getUsbDevices: () => ipcRenderer.invoke("get-usb-devices"),

  flashIso: (mode, isoPath, device) =>
    ipcRenderer.invoke("flash-iso", mode, isoPath, device),

  cancelFlash: () => ipcRenderer.send("cancel-flash"),

  pauseFlash: () => ipcRenderer.send("pause-flash"),

  resumeFlash: () => ipcRenderer.send("resume-flash"),

  onFlashEvent: (cb) => {
    const handler = (_, data) => cb(data)
    ipcRenderer.on("flash-event", handler)

    return () => ipcRenderer.removeListener("flash-event", handler)
  }
})
