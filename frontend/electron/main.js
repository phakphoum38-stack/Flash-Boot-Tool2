const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const { spawn } = require("child_process")
const path = require("path")
const fs = require("fs")
const { execSync } = require("child_process")

let mainWindow = null
let flashProc = null

// =========================
// SAFE SEND (CRITICAL FIX)
// =========================
function safeSend(win, channel, data) {
  try {
    if (!win) return
    if (win.isDestroyed()) return
    if (win.webContents.isDestroyed()) return

    win.webContents.send(channel, data)
  } catch (e) {}
}

// =========================
// BACKEND PATH
// =========================
function getBackendPath() {
  let backendPath

  if (app.isPackaged) {
    backendPath = path.join(
      process.resourcesPath,
      "backend",
      "backend.exe"
    )
  } else {
    backendPath = path.resolve(
      __dirname,
      "../../backend/dist/backend.exe"
    )
  }

  console.log("BACKEND PATH =", backendPath)
  console.log("BACKEND EXISTS =", fs.existsSync(backendPath))

  return backendPath
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
// USB EJECT (FIX)
// =========================
function ejectUSB(devicePath) {
  try {
    execSync(`mountvol ${devicePath}: /D`)
  } catch {}
}

// =========================
// USB CACHE
// =========================
let usbCache = []
let lastUsbTime = 0

async function getUsbDevices() {
  const now = Date.now()
  if (now - lastUsbTime < 2000) return usbCache

  try {
    const cmd =
      `powershell -NoProfile "Get-CimInstance Win32_DiskDrive | ` +
      `Where-Object {$_.InterfaceType -eq 'USB'} | ` +
      `Select DeviceID,Model,Size | ConvertTo-Json"`

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
// FLASH ENGINE (FIXED)
// =========================
ipcMain.handle("flash-iso", async (event, mode, iso, device) => {
  try {
    const backend = getBackendPath()

    if (!fs.existsSync(backend)) {
      safeSend(mainWindow, "flash-event", {
        type: "error",
        msg: "backend.exe not found"
      })

      return { success: false }
    }

    // 🔥 EJECT USB BEFORE FLASH (IMPORTANT FIX)
    ejectUSB(device)

    flashProc = spawn(
      backend,
      [mode, iso, device],
      {
        windowsHide: true,
        shell: true
      }
    )

    let buffer = ""
    const MAX_BUFFER = 64 * 1024

    flashProc.stdout.on("data", (data) => {
      buffer += data.toString()

      if (buffer.length > MAX_BUFFER) {
        buffer = buffer.slice(-MAX_BUFFER)
      }

      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ""

      for (const line of lines) {
        const msg = line.trim()

        if (!mainWindow || mainWindow.isDestroyed()) return

        console.log("[BACKEND]", msg)

        if (msg.startsWith("PROGRESS:")) {
          safeSend(mainWindow, "flash-event", {
            type: "progress",
            value: Number(msg.split(":")[1])
          })
        }

        else if (msg.startsWith("VERIFY:")) {
          safeSend(mainWindow, "flash-event", {
            type: "verify",
            value: Number(msg.split(":")[1])
          })
        }

        else if (msg.startsWith("LOG:")) {
          safeSend(mainWindow, "flash-event", {
            type: "log",
            msg: msg.replace("LOG:", "").trim()
          })
        }

        else {
          safeSend(mainWindow, "flash-event", {
            type: "log",
            msg
          })
        }
      }
    })

    flashProc.stderr.on("data", (data) => {
      safeSend(mainWindow, "flash-event", {
        type: "error",
        msg: data.toString()
      })
    })

    flashProc.on("close", (code) => {
      safeSend(mainWindow, "flash-event", {
        type: "result",
        success: code === 0
      })

      flashProc = null
    })

    flashProc.on("error", (err) => {
      safeSend(mainWindow, "flash-event", {
        type: "error",
        msg: err.message
      })

      flashProc = null
    })

    return { success: true }
  } catch (err) {
    safeSend(mainWindow, "flash-event", {
      type: "error",
      msg: err.message
    })

    return { success: false }
  }
})

// =========================
// CANCEL FLASH (SAFE)
// =========================
ipcMain.on("cancel-flash", () => {
  if (flashProc) {
    try {
      flashProc.kill("SIGTERM")
    } catch {}

    flashProc = null

    safeSend(mainWindow, "flash-event", {
      type: "cancelled"
    })
  }
})

// =========================
// LIFECYCLE FIX
// =========================
app.on("before-quit", () => {
  if (flashProc) {
    try {
      flashProc.kill()
    } catch {}
  }
})

app.whenReady().then(createWindow)
