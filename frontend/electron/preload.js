console.log('preload loaded')

const {
  contextBridge,
  ipcRenderer
} = require('electron')

contextBridge.exposeInMainWorld(
  'electronAPI',
  {

    // =========================
    // SELECT ISO
    // =========================
    selectIso: async () => {

      try {

        return await ipcRenderer.invoke(
          'select-iso'
        )

      } catch (e) {

        console.error(
          'selectIso error:',
          e
        )

        return null
      }
    },

    // =========================
    // GET USB
    // =========================
    getUsbDevices: async () => {

      try {

        return await ipcRenderer.invoke(
          'get-usb-devices'
        )

      } catch (e) {

        console.error(
          'getUsbDevices error:',
          e
        )

        return []
      }
    },

    // =========================
    // FLASH ISO
    // =========================
    flashIso: async (
      mode,
      isoPath,
      device
    ) => {

      try {

        return await ipcRenderer.invoke(
          'flash-iso',
          mode,
          isoPath,
          device
        )

      } catch (e) {

        console.error(
          'flashIso error:',
          e
        )

        throw e
      }
    },

    // =========================
    // PAUSE
    // =========================
    pauseFlash: () => {

      ipcRenderer.send(
        'pause-flash'
      )
    },

    // =========================
    // RESUME
    // =========================
    resumeFlash: () => {

      ipcRenderer.send(
        'resume-flash'
      )
    },

    // =========================
    // CANCEL
    // =========================
    cancelFlash: () => {

      ipcRenderer.send(
        'cancel-flash'
      )
    },

    // =========================
    // FLASH EVENT
    // =========================
    onFlashEvent: (callback) => {

      const listener =
        (_, data) => {

          callback(data)
        }

      ipcRenderer.on(
        'flash-event',
        listener
      )

      // unsubscribe
      return () => {

        ipcRenderer.removeListener(
          'flash-event',
          listener
        )
      }
    },

    // =========================
    // REMOVE LISTENER
    // =========================
    removeAllListeners: (
      channel
    ) => {

      ipcRenderer.removeAllListeners(
        channel
      )
    }
  }
)
