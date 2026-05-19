const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const { spawn } = require("child_process")
const path = require("path")
const drivelist = require("drivelist")

let backend

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

// ดึงรายชื่อ USB
ipcMain.handle("get-usb-devices", async () => {
  const drives = await drivelist.list()
  return drives
  .filter(d => d.isUSB &&!d.isSystem && d.mountpoints.length > 0)
  .map(d => ({
      path: d.device,
      name: d.description,
      size: d.size,
      mount: d.mountpoints[0]?.path || ''
    }))
})

// เพิ่มตรงนี้ - สั่ง flash
ipcMain.handle("flash-iso", async (event, isoPath, device) => {
  return new Promise((resolve, reject) => {
    // เรียก backend.exe ที่รันอยู่แล้ว ส่งคำสั่งผ่าน stdin/stdout
    // หรือถ้า backend.exe รันแบบ one-shot ให้ spawn ใหม่:
    const backendExe = app.isPackaged
    ? path.join(process.resourcesPath, "backend", "backend.exe")
      : path.join(__dirname, "../../backend/dist/backend.exe")

    const proc = spawn(backendExe, ["flash", isoPath, device], { windowsHide: true })

    proc.stdout.on("data", (data) => {
      const msg = data.toString().trim()
      console.log("Backend:", msg)

      // ถ้า backend ส่ง "PROGRESS:50" ออกมา
      if (msg.startsWith("PROGRESS:")) {
        const percent = parseInt(msg.split(":")[1])
        event.sender.send("flash-progress", percent)
      }
    })

    proc.stderr.on("data", (data) => {
      event.sender.send("flash-error", data.toString())
    })

    proc.on("close", (code) => {
      resolve({ success: code === 0 })
    })
  })
})

app.whenReady().then(() => {
  startBackend()
  setTimeout(() => {
    createWindow()
  }, 2000)
})

app.on("will-quit", () => {
  if (backend) backend.kill()
})
