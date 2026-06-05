const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const { spawn } = require("child_process")
const path = require("path")
const fs = require("fs")

let mainWindow = null
let backendProc = null
let flashProc = null

// =========================
// PATH
// =========================
function getBackendPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend", "backend.exe")
  }
  return path.join(__dirname, "../../backend/dist/backend.exe")
}

// =========================
// WINDOW
// =========================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) mainWindow.loadURL(devUrl)
  else mainWindow.loadFile(path.join(__dirname, "../dist/index.html"))

  mainWindow.webContents.openDevTools()
}

// =========================
// USB CACHE (ลด lag)
// =========================
let usbCache = []
let lastUsbTime = 0

async function getUsbDevices() {
  const now = Date.now()
  if (now - lastUsbTime < 2000) return usbCache

  const { execSync } = require("child_process")

  try {
    const cmd = `powershell -NoProfile "Get-CimInstance Win32_DiskDrive | Where-Object {$_.InterfaceType -eq 'USB'} | Select DeviceID,Model,Size | ConvertTo-Json"`

    const out = execSync(cmd).toString().trim()
    if (!out) return []

    const data = JSON.parse(out)
    const arr = Array.isArray(data) ? data : [data]

    usbCache = arr.map(d => ({
      path: d.DeviceID,
      name: d.Model || "USB",
      size: Number(d.Size || 0)
    }))

    lastUsbTime = now
    return usbCache
  } catch {
    return []
  }
}

// =========================
// IPC: USB
// =========================
ipcMain.handle("get-usb-devices", async () => {
  return getUsbDevices()
})

// =========================
// IPC: ISO
// =========================
ipcMain.handle("select-iso", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "ISO", extensions: ["iso", "img"] }]
  })

  return result.canceled ? null : result.filePaths[0]
})

// =========================
// FLASH ENGINE (STREAM + EVENT BUS)
// =========================
ipcMain.handle("flash-iso", async (event, mode, iso, device) => {
  const backend = getBackendPath()

  if (!fs.existsSync(backend)) {
    event.sender.send("flash-event", {
      type: "error",
      msg: "backend missing"
    })
    return { success: false }
  }

  flashProc = spawn(backend, [mode, iso, device], {
    windowsHide: true
  })

  let buffer = ""

  flashProc.stdout.on("data", data => {
    buffer += data.toString()

    let lines = buffer.split("\n")
    buffer = lines.pop()

    for (const line of lines) {
      const msg = line.trim()

      // PROGRESS 0-100
      if (msg.startsWith("PROGRESS:")) {
        const v = Number(msg.split(":")[1])
        event.sender.send("flash-event", {
          type: "progress",
          value: v
        })
      }

      // VERIFY
      if (msg.startsWith("VERIFY:")) {
        const v = Number(msg.split(":")[1])
        event.sender.send("flash-event", {
          type: "verify",
          value: v
        })
      }

      // LOG
      if (msg.startsWith("LOG:")) {
        event.sender.send("flash-event", {
          type: "log",
          msg: msg.replace("LOG:", "").trim()
        })
      }
    }
  })

  flashProc.on("close", code => {
    event.sender.send("flash-event", {
      type: "result",
      success: code === 0
    })
    flashProc = null
  })

  flashProc.on("error", err => {
    event.sender.send("flash-event", {
      type: "error",
      msg: err.message
    })
  })

  return { success: true }
})

// =========================
// CANCEL SAFE
// =========================
ipcMain.on("cancel-flash", () => {
  if (flashProc) {
    flashProc.kill()
    flashProc = null
    mainWindow.webContents.send("flash-event", {
      type: "cancelled"
    })
  }
})

app.whenReady().then(createWindow)
