console.log("PRELOAD LOADED");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
contextBridge.exposeInMainWorld("electron", {

  flashIso: (mode, iso, device) =>
    ipcRenderer.invoke(
      "flash-iso",
      mode,
      iso,
      device
    ),

  selectIso: () =>
    ipcRenderer.invoke(
      "select-iso"
    ),

  getUsbDevices: () =>
    ipcRenderer.invoke(
      "get-usb-devices"
    ),

  onFlashEvent: (callback) => {

    const handler = (_, event) =>
      callback(event)

    ipcRenderer.on(
      "flash-event",
      handler
    )

    return () =>
      ipcRenderer.removeListener(
        "flash-event",
        handler
      )
  },

  cancelFlash: () =>
    ipcRenderer.send(
      "cancel-flash"
    )
})
