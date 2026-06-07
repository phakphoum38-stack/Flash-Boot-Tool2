const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const { spawn } = require("child_process")
const path = require("path")
const fs = require("fs")
const { execSync } = require("child_process")

let mainWindow = null
let flashProc = null

// =========================
// SAFE SEND (CRASH PROTECT)
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
  let backendPath

  if (app.isPackaged) {
    backendPath = path.join(process.resourcesPath, "backend", "backend.exe")
  } else {
    backendPath = path.resolve(__dirname, "../../backend/dist/backend.exe")
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
// DISK RESOLVER (SAFE)
// =========================
function resolveDiskIndex(device) {
  const m = device.match(/PhysicalDrive(\d+)/)
  if (!m) throw new Error("Invalid PhysicalDrive format")
  return Number(m[1])
}

// =========================
// OFFLINE DISK (RUFUS STYLE)
// =========================
function offlineDisk(device) {
  try {
    const index = resolveDiskIndex(device)

    execSync(`
      powershell -NoProfile -Command "
      try {
        Set-Disk -Number ${index} -IsOffline $true
        Clear-Disk -Number ${index} -RemoveData -Confirm:$false
      } catch {}
    "`)
  } catch (e) {
    console.log("offlineDisk:", e.message)
  }
}

// =========================
// ONLINE RESTORE
// =========================
function onlineDisk(device) {
  try {
    const index = resolveDiskIndex(device)

    execSync(`
      powershell -NoProfile -Command "
      try {
        Set-Disk -Number ${index} -IsOffline $false
      } catch {}
    "`)
  } catch {}
}

// =========================
// USB LIST (FIXED INDEX MAPPING)
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
      `Select Index,Model,Size | ConvertTo-Json"`

    const out = execSync(cmd).toString().trim()
    if (!out) return []

    const data = JSON.parse(out)
    const arr = Array.isArray(data) ? data : [data]

    usbCache = arr.map(d => ({
      path: `\\\\.\\PhysicalDrive${d.Index}`,
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
// IPC: ISO PICKER (FIXED)
// =========================
ipcMain.handle("select-iso", async () => {
  try {
    const win = BrowserWindow.getFocusedWindow() || mainWindow

    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [
        { name: "ISO Image", extensions: ["iso", "img"] }
      ],
      title: "Select ISO file",
      defaultPath: app.getPath("desktop")
    })

    if (result.canceled) return null
    return result.filePaths[0]
  } catch (err) {
    console.log("ISO ERROR:", err)
    return null
  }
})

// =========================
// FLASH ENGINE (STABLE PIPELINE)
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

    if (!device.includes("PhysicalDrive")) {
      throw new Error("Invalid device format")
    }

    // 🔥 OFFLINE DISK BEFORE FLASH
    offlineDisk(device)
    await new Promise(r => setTimeout(r, 800))

    flashProc = spawn(
      backend,
      [mode, iso, device],
      {
        windowsHide: true,
        shell: false
      }
    )

    let buffer = ""

    flashProc.stdout.on("data", (data) => {
      buffer += data.toString()

      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ""

      for (const line of lines) {
        const msg = line.trim()

        if (!mainWindow || mainWindow.isDestroyed()) return

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
      onlineDisk(device)

      safeSend(mainWindow, "flash-event", {
        type: "result",
        success: code === 0
      })

      flashProc = null
    })

    flashProc.on("error", (err) => {
      onlineDisk(device)

      safeSend(mainWindow, "flash-event", {
        type: "error",
        msg: err.message
      })

      flashProc = null
    })

    return { success: true }
  } catch (err) {
    onlineDisk(device)

    safeSend(mainWindow, "flash-event", {
      type: "error",
      msg: err.message
    })

    return { success: false }
  }
})

// =========================
// CANCEL FLASH
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
