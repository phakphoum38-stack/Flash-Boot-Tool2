const { contextBridge, ipcRenderer } = require("electron");

console.log("PRELOAD LOADED");

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

  pauseFlash: () =>
    ipcRenderer.invoke(
      "pause-flash"
    ),

  resumeFlash: () =>
    ipcRenderer.invoke(
      "resume-flash"
    ),

  cancelFlash: () =>
    ipcRenderer.invoke(
      "cancel-flash"
    ),

  onFlashEvent: (callback) => {

    const handler = (_, data) =>
      callback(data);

    ipcRenderer.on(
      "flash-event",
      handler
    );

    return () =>
      ipcRenderer.removeListener(
        "flash-event",
        handler
      );
  }

});
