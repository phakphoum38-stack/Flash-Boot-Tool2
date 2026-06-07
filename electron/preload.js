const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {

  invoke: (ch, ...args) =>
    ipcRenderer.invoke(ch, ...args),

  on: (ch, cb) =>
    ipcRenderer.on(ch, cb)

})
