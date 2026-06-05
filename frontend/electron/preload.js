const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {

  selectIso: () => ipcRenderer.invoke("select-iso"),

  getUsbDevices: () => ipcRenderer.invoke("get-usb-devices"),

  flashIso: (mode, iso, device) =>
    ipcRenderer.invoke("flash-iso", mode, iso, device),

  cancelFlash: () => ipcRenderer.send("cancel-flash"),

  onFlashEvent: (cb) => {
    const handler = (_, data) => cb(data)
    ipcRenderer.on("flash-event", handler)
    return () => ipcRenderer.removeListener("flash-event", handler)
  }
})
