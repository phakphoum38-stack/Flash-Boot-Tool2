import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  // =========================
  // ISO
  // =========================
  selectIso: () =>
    ipcRenderer.invoke("select-iso"),

  // =========================
  // USB
  // =========================
  getUsbDevices: () =>
    ipcRenderer.invoke("get-usb-devices"),

  // =========================
  // FLASH
  // =========================
  flashIso: (
    mode: string,
    isoPath: string,
    device: string
  ) =>
    ipcRenderer.invoke(
      "flash-iso",
      mode,
      isoPath,
      device
    ),

  // =========================
  // EVENTS
  // =========================
  onFlashEvent: (
    callback: (data: any) => void
  ) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      data: any
    ) => {
      callback(data);
    };

    ipcRenderer.on(
      "flash-event",
      handler
    );

    return () => {
      ipcRenderer.removeListener(
        "flash-event",
        handler
      );
    };
  },

  // =========================
  // CONTROL
  // =========================
  cancelFlash: () =>
    ipcRenderer.invoke(
      "cancel-flash"
    ),
});
