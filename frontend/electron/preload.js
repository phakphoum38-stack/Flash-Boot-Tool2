const { contextBridge, ipcRenderer } = require("electron")

let listeners = new Set()

contextBridge.exposeInMainWorld("electron", {
  flashIso: (mode, iso, device) =>
    ipcRenderer.invoke("flash-iso", mode, iso, device),

  selectIso: () =>
    ipcRenderer.invoke("select-iso"),

  getUsbDevices: () =>
    ipcRenderer.invoke("get-usb-devices"),

  onFlashEvent: (cb) => {
    const handler = (_, data) => cb(data)

    ipcRenderer.on("flash-event", handler)
    listeners.add(handler)

    return () => {
      ipcRenderer.removeListener("flash-event", handler)
      listeners.delete(handler)
    }
  },

  cancelFlash: () => ipcRenderer.send("cancel-flash"),
  pauseFlash: () => ipcRenderer.send("pause-flash"),
  resumeFlash: () => ipcRenderer.send("resume-flash")
})
