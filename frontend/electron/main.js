const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const { spawn, exec } = require("child_process")
const { promisify } = require("util")
const path = require("path")
const fs = require("fs")
const isAdmin = require("is-admin")

const execPromise = promisify(exec)

let mainWindow
let backend
let currentFlashProc = null

// =========================
// Backend Path
// =========================
function getBackendPath() {
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,
      "backend",
      "backend.exe"
    )
  }

  return path.join(
    __dirname,
    "../../backend/dist/backend.exe"
  )
}

// =========================
// Start Backend
// =========================
function startBackend() {
  const exePath = getBackendPath()

  console.log("================================")
  console.log("Backend Path:", exePath)
  console.log("App Packaged:", app.isPackaged)
  console.log("Exists:", fs.existsSync(exePath))
  console.log("Resources Path:", process.resourcesPath)
  console.log("================================")

  if (!fs.existsSync(exePath)) {
    dialog.showErrorBox(
      "Backend Error",
      `backend.exe not found:\n\n${exePath}`
    )
    return
  }

  backend = spawn(exePath, [], {
    windowsHide: true
  })

  backend.stdout.on("data", data => {
    console.log("[Backend]", data.toString())
  })

  backend.stderr.on("data", data => {
    console.error("[Backend ERR]", data.toString())
  })

  backend.on("error", err => {
    console.error("SPAWN ERROR:", err)

    dialog.showErrorBox(
      "Spawn Error",
      err.message
    )
  })

  backend.on("close", code => {
    console.log("Backend exited:", code)
  })
}

// =========================
// Create Window
// =========================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,

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
    mainWindow.loadFile(
      path.join(__dirname, "../dist/index.html")
    )
  }

  mainWindow.webContents.openDevTools()
}

// =========================
// Run as Admin
// =========================
const runAsAdmin = async () => {
  const admin = await isAdmin()

  if (!admin) {
    const args = process.argv.slice(1).join(",")

    spawn(
      "powershell",
      [
        "Start-Process",
        process.execPath,
        "-Verb",
        "runAs",
        "-ArgumentList",
        args
      ],
      {
        detached: true,
        stdio: "ignore"
      }
    )

    app.quit()

    return false
  }

  return true
}

// =========================
// App Ready
// =========================
app.whenReady().then(async () => {
  if (!(await runAsAdmin())) return

  startBackend()

  setTimeout(() => {
    createWindow()
  }, 2000)
})

// =========================
// Cleanup
// =========================
app.on("will-quit", () => {
  if (backend) {
    backend.kill()
  }

  if (currentFlashProc) {
    currentFlashProc.kill()
  }
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// =========================
// Select ISO
// =========================
const {
  app,
  BrowserWindow,
  ipcMain,
  dialog
} = require('electron')

ipcMain.handle(
  'select-iso',
  async () => {

    console.log(
      'SELECT ISO CALLED'
    )

    const result =
      await dialog.showOpenDialog({

        title: 'Select ISO',

        filters: [
          {
            name: 'ISO Files',
            extensions: [
              'iso',
              'img'
            ]
          }
        ],

        properties: [
          'openFile'
        ]
      })

    if (result.canceled) {
      return null
    }

    return result.filePaths[0]
  }
)

// =========================
// Get USB Devices
// =========================
ipcMain.handle("get-usb-devices", async () => {
  try {
    const cmd = `
      powershell "Get-Disk |
      Where-Object {
        $_.BusType -eq 'USB'
      } |
      Select-Object Number, FriendlyName, Size |
      ConvertTo-Json"
    `

    const { stdout } = await execPromise(cmd)

    if (!stdout.trim()) {
      return []
    }

    const disks = JSON.parse(stdout)

    const diskArray = Array.isArray(disks)
      ? disks
      : [disks]

    return diskArray.map(d => ({
      path: `\\\\.\\PhysicalDrive${d.Number}`,
      name: d.FriendlyName,
      size: parseInt(d.Size)
    }))
  } catch (e) {
    console.error("Get USB devices failed:", e)
    return []
  }
})

// =========================
// Flash ISO
// =========================
ipcMain.handle(
  "flash-iso",
  async (event, mode, isoPath, device) => {
    console.log("=== Flash Start ===")

    console.log({
      mode,
      isoPath,
      device
    })

    return new Promise(resolve => {
      const backendExe = getBackendPath()

      console.log("FLASH BACKEND:", backendExe)
      console.log(
        "BACKEND EXISTS:",
        fs.existsSync(backendExe)
      )

      if (!fs.existsSync(backendExe)) {
        event.sender.send("flash-event", {
          type: "error",
          msg: "backend.exe not found"
        })

        resolve({
          success: false
        })

        return
      }

      currentFlashProc = spawn(
        backendExe,
        [mode, isoPath, device],
        {
          windowsHide: true
        }
      )

      currentFlashProc.stdout.on(
        "data",
        data => {
          const msg = data.toString().trim()

          console.log("Backend OUT:", msg)

          if (msg.startsWith("PROGRESS:")) {
            const percent = parseInt(
              msg.split(":")[1]
            )

            event.sender.send("flash-event", {
              type: "progress",
              value: percent
            })
          }

          if (msg.startsWith("LOG:")) {
            event.sender.send("flash-event", {
              type: "log",
              level: "info",
              msg: msg.substring(4).trim()
            })
          }
        }
      )

      currentFlashProc.stderr.on(
        "data",
        data => {
          const err = data.toString().trim()

          console.error("Backend ERR:", err)

          event.sender.send("flash-event", {
            type: "error",
            msg: err
          })
        }
      )

      currentFlashProc.on("error", err => {
        console.error("FLASH SPAWN ERROR:", err)

        event.sender.send("flash-event", {
          type: "error",
          msg: err.message
        })
      })

      currentFlashProc.on("close", code => {
        console.log("Backend Exit Code:", code)

        event.sender.send("flash-event", {
          type: "result",
          success: code === 0,
          msg: code === 0
            ? "Success"
            : "Failed"
        })

        currentFlashProc = null

        resolve({
          success: code === 0
        })
      })
    })
  }
)

// =========================
// Cancel Flash
// =========================
ipcMain.on("cancel-flash", () => {
  if (currentFlashProc) {
    currentFlashProc.kill("SIGTERM")

    currentFlashProc = null

    mainWindow.webContents.send(
      "flash-event",
      {
        type: "cancelled"
      }
    )
  }
})

// =========================
// Pause Flash
// =========================
ipcMain.on("pause-flash", () => {
  if (currentFlashProc) {
    currentFlashProc.stdin.write("pause\n")

    mainWindow.webContents.send(
      "flash-event",
      {
        type: "paused"
      }
    )
  }
})

// =========================
// Resume Flash
// =========================
ipcMain.on("resume-flash", () => {
  if (currentFlashProc) {
    currentFlashProc.stdin.write("resume\n")

    mainWindow.webContents.send(
      "flash-event",
      {
        type: "resumed"
      }
    )
  }
})
