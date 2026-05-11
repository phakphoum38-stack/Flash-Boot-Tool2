const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {

  selectISO: () => ipcRenderer.invoke("select-iso")

});
