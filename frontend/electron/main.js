const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const { spawn, exec } = require("child_process")
const { promisify } = require("util")
const path = require("path")
const fs = require("fs")

const execPromise = promisify(exec)

let mainWindow = null
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
// SELECT ISO
// =========================
ipcMain.handle("select-iso", async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "ISO", extensions: ["iso", "img"] }]
  })

  return res.canceled ? null : res.filePaths[0]
})

// =========================
// USB LIST
// =========================
ipcMain.handle("get-usb-devices", async () => {
  try {
    const cmd = `powershell -NoProfile -Command "
Get-CimInstance Win32_DiskDrive |
Where-Object { $_.InterfaceType -eq 'USB' } |
Select DeviceID,Model,Size |
ConvertTo-Json
"`

    const { stdout } = await execPromise(cmd)
    if (!stdout) return []

    const data = JSON.parse(stdout)
    const arr = Array.isArray(data) ? data : [data]

    return arr.map(d => ({
      path: d.DeviceID,
      name: d.Model || "USB",
      size: Number(d.Size || 0)
    }))
  } catch {
    return []
  }
})

// =========================
// FLASH ENGINE (MULTI MODE)
// =========================
ipcMain.handle("flash-iso", async (event, mode, isoPath, device) => {

  return new Promise((resolve) => {

    const backendExe = getBackendPath()

    if (!fs.existsSync(backendExe)) {
      event.sender.send("flash-event", {
        type: "error",
        msg: "backend.exe not found"
      })
      return resolve({ success: false })
    }

    flashProc = spawn(backendExe, [
      "flash",
      mode,
      isoPath,
      device
    ])

    flashProc.stdout.on("data", (data) => {
      const lines = data.toString().split("\n").filter(Boolean)

      for (const line of lines) {
        const msg = line.trim()

        // =========================
        // PROGRESS
        // =========================
        if (msg.startsWith("PROGRESS:")) {
          event.sender.send("flash-event", {
            type: "progress",
            value: Number(msg.split(":")[1])
          })
        }

        // =========================
        // VERIFY
        // =========================
        if (msg.startsWith("VERIFY:")) {
          event.sender.send("flash-event", {
            type: "verify_progress",
            value: Number(msg.split(":")[1])
          })
        }

        // =========================
        // LOG
        // =========================
        if (msg.startsWith("LOG:")) {
          event.sender.send("flash-event", {
            type: "log",
            msg: msg.replace("LOG:", "").trim()
          })
        }
      }
    })

    flashProc.stderr.on("data", (d) => {
      event.sender.send("flash-event", {
        type: "error",
        msg: d.toString()
      })
    })

    flashProc.on("close", (code) => {

      event.sender.send("flash-event", {
        type: "result",
        success: code === 0
      })

      flashProc = null
      resolve({ success: code === 0 })
    })
  })
})

// =========================
// CANCEL
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

// =========================
// APP
// =========================
app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
ipcMain.on("cancel-flash", () => {
  if (currentFlashProc) {
    currentFlashProc.kill()
    currentFlashProc = null

    mainWindow.webContents.send("flash-event", {
      type: "cancelled"
    })
  }
})

// =========================
// APP
// =========================
app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
