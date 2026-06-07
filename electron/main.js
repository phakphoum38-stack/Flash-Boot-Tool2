const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const { spawn } = require("child_process")
const path = require("path")
const fs = require("fs")
const { execSync } = require("child_process")

let mainWindow = null
let flashProc = null

// =========================
// SAFE SEND
// =========================
function safeSend(win, channel, data) {
  try {
    if (!win) return
    if (win.isDestroyed()) return
    if (win.webContents.isDestroyed()) return
    win.webContents.send(channel, data)
  } catch {}
}

// =========================
// BACKEND PATH
// =========================
function getBackendPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "backend", "backend.exe")
    : path.resolve(__dirname, "../../backend/dist/backend.exe")
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
// SANITIZE DEVICE (🔥 IMPORTANT FIX)
// =========================
function sanitizeDevice(device) {
  if (!device) return ""
  return device.replace(/\s/g, "").trim()
}

// =========================
// DISK INDEX
// =========================
function resolveDiskIndex(device) {
  const m = device.match(/PhysicalDrive(\d+)/)
  if (!m) throw new Error("Invalid device format")
  return Number(m[1])
}

// =========================
// USB LIST FIXED
// =========================
async function getUsbDevices() {
  try {
    const cmd =
      `powershell -NoProfile "Get-CimInstance Win32_DiskDrive | ` +
      `Where-Object {$_.InterfaceType -eq 'USB'} | ` +
      `Select Index,Model,Size | ConvertTo-Json"`

    const out = execSync(cmd).toString().trim()
    if (!out) return []

    const data = JSON.parse(out)
    const arr = Array.isArray(data) ? data : [data]

    return arr.map(d => ({
      path: `\\\\.\\PhysicalDrive${d.Index}`,
      name: d.Model || "USB",
      size: Number(d.Size || 0)
    }))
  } catch {
    return []
  }
}

// =========================
// ISO PICKER FIXED
// =========================
ipcMain.handle("select-iso", async () => {
  try {
    const win = mainWindow

    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [{ name: "ISO", extensions: ["iso", "img"] }],
      defaultPath: app.getPath("desktop")
    })

    if (result.canceled) return null
    return result.filePaths[0]
  } catch {
    return null
  }
})

// =========================
// FLASH ENGINE (RUFUS-STYLE SAFE)
// =========================
ipcMain.handle("flash-iso", async (event, mode, iso, device) => {
  try {
    if (flashProc) {
      return { success: false, error: "Flash already running" }
    }

    const backend = getBackendPath()

    if (!fs.existsSync(backend)) {
      safeSend(mainWindow, "flash-event", {
        type: "error",
        msg: "backend.exe not found"
      })
      return { success: false }
    }

    device = sanitizeDevice(device)

    if (!device.includes("PhysicalDrive")) {
      throw new Error("Invalid device format")
    }

    flashProc = spawn(backend, [mode, iso, device], {
      windowsHide: true,
      shell: false
    })

    let buffer = ""

    flashProc.stdout.on("data", (data) => {
      buffer += data.toString()

      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ""

      for (const line of lines) {
        const msg = line.trim()
        if (!msg) continue

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
// CANCEL
// =========================
ipcMain.on("cancel-flash", () => {
  if (flashProc) {
    try { flashProc.kill("SIGTERM") } catch {}
    flashProc = null

    safeSend(mainWindow, "flash-event", {
      type: "cancelled"
    })
  }
})

// =========================
// CLEAN EXIT
// =========================
app.on("before-quit", () => {
  if (flashProc) {
    try { flashProc.kill() } catch {}
  }
})

app.whenReady().then(createWindow)
