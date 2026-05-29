const { contextBridge, ipcRenderer } = require("electron")

console.log("PRELOAD LOADED")

contextBridge.exposeInMainWorld("electronAPI", {

  // =========================
  // Select ISO
  // =========================
  selectIso: async () => {
    return await ipcRenderer.invoke("select-iso")
  },

  // =========================
  // USB Devices
  // =========================
  getUsbDevices: async () => {
    return await ipcRenderer.invoke("get-usb-devices")
  },

  // =========================
  // Flash ISO
  // =========================
  flashIso: async (
    mode,
    isoPath,
    device
  ) => {

    return await ipcRenderer.invoke(
      "flash-iso",
      mode,
      isoPath,
      device
    )
  },

  // =========================
  // Flash Events
  // =========================
  onFlashEvent: (callback) => {

    const listener = (
      event,
      data
    ) => {

      callback(data)
    }

    ipcRenderer.on(
      "flash-event",
      listener
    )

    // unsubscribe
    return () => {

      ipcRenderer.removeListener(
        "flash-event",
        listener
      )
    }
  },

  // =========================
  // Pause
  // =========================
  pauseFlash: () => {

    ipcRenderer.send(
      "pause-flash"
    )
  },

  // =========================
  // Resume
  // =========================
  resumeFlash: () => {

    ipcRenderer.send(
      "resume-flash"
    )
  },

  // =========================
  // Cancel
  // =========================
  cancelFlash: () => {

    ipcRenderer.send(
      "cancel-flash"
    )
  }
})
