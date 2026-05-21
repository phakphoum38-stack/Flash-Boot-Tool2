const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const { spawn, exec } = require("child_process")
const { promisify } = require("util")
const path = require("path")
const execPromise = promisify(exec)

let backend
let currentFlashProc = null

function startBackend() {
  let exePath
  if (app.isPackaged) {
    exePath = path.join(process.resourcesPath, "backend", "backend.exe")
  } else {
    exePath = path.join(__dirname, "../../backend/dist/backend.exe")
  }
  console.log("Backend:", exePath)
  backend = spawn(exePath, [], { windowsHide: true })
  backend.stdout.on("data", d => { console.log(d.toString()) })
  backend.stderr.on("data", d => { console.error(d.toString()) })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  })
  win.loadFile(path.join(__dirname, "../dist/index.html"))
  win.webContents.openDevTools()
}

// เลือกไฟล์ ISO
ipcMain.handle("select-iso", async () => {
  const result = await dialog.showOpenDialog({
    filters: [{ name: "ISO", extensions: ["iso"] }],
    properties: ["openFile"]
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

// ดึงรายชื่อ USB ใช้ PowerShell แทน drivelist
ipcMain.handle("get-usb-devices", async () => {
  try {
    const cmd = `powershell "Get-Disk | Where-Object {$_.BusType -eq 'USB' -and $_.PartitionStyle -ne 'RAW'} | Select-Object Number, FriendlyName, Size | ConvertTo-Json"`
    const { stdout } = await execPromise(cmd)

    if (!stdout.trim()) return []

    const disks = JSON.parse(stdout)
    const diskArray = Array.isArray(disks)? disks : [disks]

    return diskArray.map(d => ({
      path: `\\\\.\\PhysicalDrive${d.Number}`,
      name: d.FriendlyName,
      size: parseInt(d.Size),
      mount: ''
    }))
  } catch (e) {
    console.error('Get USB devices failed:', e)
    return []
  }
})

// สั่ง flash
ipcMain.handle("flash-iso", async (event, mode, isoPath, device) => {
  console.log("=== Flash Start ===")
  console.log("Mode:", mode)
  console.log("ISO Path:", isoPath)
  console.log("Device:", device)

  return new Promise((resolve) => {
    const backendExe = app.isPackaged
     ? path.join(process.resourcesPath, "backend", "backend.exe")
      : path.join(__dirname, "../../backend/dist/backend.exe")

    console.log("Backend Exe Path:", backendExe)

    currentFlashProc = spawn(backendExe, [mode, isoPath, device], { windowsHide: true })

    currentFlashProc.stdout.on("data", (data) => {
      const msg = data.toString().trim()
      console.log("Backend OUT:", msg)

      if (msg.startsWith("PROGRESS:")) {
        const percent = parseInt(msg.split(":")[1])
        event.sender.send("flash-event", { type: "progress", value: percent })
      }
      if (msg.startsWith("LOG:")) {
        event.sender.send("flash-event", { type: "log", level: "info", msg: msg.substring(5) })
      }
    })

    currentFlashProc.stderr.on("data", (data) => {
      const err = data.toString().trim()
      console.error("Backend ERR:", err)
      event.sender.send("flash-event", { type: "error", msg: err })
    })

    currentFlashProc.on("close", (code) => {
      console.log("Backend Exit Code:", code)
      event.sender.send("flash-event", {
        type: "result",
        success: code === 0,
        msg: code === 0? "Success" : "Failed"
      })
      currentFlashProc = null
      resolve({ success: code === 0 })
    })
  })
})

// ควบคุม process
ipcMain.on("cancel-flash", () => {
  if (currentFlashProc) {
    currentFlashProc.kill()
    currentFlashProc = null
  }
})

ipcMain.on("pause-flash", () => {
  if (currentFlashProc) {
    // Windows ใช้ stdin ส่งคำสั่ง pause ไปให้ backend แทน
    currentFlashProc.stdin.write("pause\n")
  }
})

ipcMain.on("resume-flash", () => {
  if (currentFlashProc) {
    currentFlashProc.stdin.write("resume\n")
  }
})

const isAdmin = require('is-admin')
isAdmin().then(admin => {
  if (!admin) {
    const args = process.argv.slice(1)
    spawn('powershell', [
      'Start-Process',
      process.execPath,
      '-Verb', 'runAs',
      '-ArgumentList', args.join(',')
    ], { detached: true, stdio: 'ignore' })
    app.quit()
    return
  }

  app.whenReady().then(() => {
    startBackend()
    setTimeout(createWindow, 2000)
  })
})

app.on("will-quit", () => {
  if (backend) backend.kill()
  if (currentFlashProc) currentFlashProc.kill()
})
