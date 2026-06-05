const {
  app,
  BrowserWindow,
  ipcMain,
  dialog
} = require("electron")

const { spawn } = require("child_process")
const path = require("path")
const fs = require("fs")
const isAdmin = require("is-admin")

let mainWindow
let backend = null
let currentFlashProc = null

// =========================
// PATH
// =========================
function getBackendPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "backend", "backend.exe")
    : path.join(__dirname, "../../backend/dist/backend.exe")
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

  if (devUrl) {
    mainWindow.loadURL(devUrl)
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"))
  }

  mainWindow.webContents.openDevTools()
}

// =========================
// USB AUTO REFRESH CACHE
// =========================
let usbCache = []
let usbLastTime = 0

ipcMain.handle("get-usb-devices", async () => {
  const now = Date.now()

  // 🔥 cache 1.5s ลด lag
  if (now - usbLastTime < 1500) return usbCache

  try {
    const { exec } = require("child_process")
    const util = require("util")
    const execPromise = util.promisify(exec)

    const cmd = `
powershell -NoProfile -ExecutionPolicy Bypass "
Get-CimInstance Win32_DiskDrive |
Where-Object { $_.InterfaceType -eq 'USB' } |
Select DeviceID, Model, Size |
ConvertTo-Json -Depth 2
"
`

    const { stdout } = await execPromise(cmd)

    const raw = stdout ? JSON.parse(stdout) : []
    const arr = Array.isArray(raw) ? raw : [raw]

    usbCache = arr.map(d => ({
      path: d.DeviceID,
      name: d.Model || "USB",
      size: Number(d.Size || 0)
    }))

    usbLastTime = now
    return usbCache
  } catch {
    return usbCache
  }
})

// =========================
// SELECT ISO
// =========================
ipcMain.handle("select-iso", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "ISO", extensions: ["iso", "img"] }]
  })

  return result.canceled ? null : result.filePaths[0]
})

// =========================
// FLASH ENGINE
// =========================
ipcMain.handle("flash-iso", async (event, mode, iso, device) => {
  return new Promise(resolve => {

    const backendExe = getBackendPath()

    if (!fs.existsSync(backendExe)) {
      event.sender.send("flash-event", {
        type: "error",
        msg: "backend not found"
      })
      return resolve({ success: false })
    }

    const args = ["flash", mode, iso, device]

    currentFlashProc = spawn(backendExe, args)

    currentFlashProc.stdout.on("data", data => {
      const lines = data.toString().split("\n")

      for (const line of lines) {

        if (line.startsWith("PROGRESS:")) {
          event.sender.send("flash-event", {
            type: "progress",
            value: Number(line.split(":")[1])
          })
        }

        if (line.startsWith("VERIFY:")) {
          event.sender.send("flash-event", {
            type: "verify_progress",
            value: Number(line.split(":")[1])
          })
        }

        if (line.startsWith("LOG:")) {
          event.sender.send("flash-event", {
            type: "log",
            msg: line.replace("LOG:", "").trim()
          })
        }
      }
    })

    currentFlashProc.on("close", code => {
      event.sender.send("flash-event", {
        type: "result",
        success: code === 0
      })

      currentFlashProc = null
      resolve({ success: code === 0 })
    })
  })
})

// =========================
// CANCEL
// =========================
ipcMain.on("cancel-flash", () => {
  if (currentFlashProc) {
    currentFlashProc.kill()
    currentFlashProc = null

    mainWindow.webContents.send("flash-event", {
      type: "cancelled"
    })
  }
})

app.whenReady().then(createWindow)
