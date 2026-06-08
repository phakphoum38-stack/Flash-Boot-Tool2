export {};

declare global {
  interface Window {
    electron: {
      selectIso: () => Promise<string | null>;

      getUsbDevices: () => Promise<any[]>;

      flashIso: (
        mode: string,
        isoPath: string,
        device: string
      ) => Promise<any>;

      cancelFlash: () => Promise<void>;

      onFlashEvent: (
        callback: (event: any) => void
      ) => () => void;
    };
  }
}
