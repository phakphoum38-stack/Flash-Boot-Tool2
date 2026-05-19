const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

let backend;

function startBackend() {
  let exePath;
  if (app.isPackaged) {
    exePath = path.join(process.resourcesPath, "backend", "backend.exe");
  } else {
    exePath = path.join(__dirname, "../../backend/dist/backend.exe");
  }

  console.log("Backend:", exePath);
  backend = spawn(exePath, [], { windowsHide: true });

  backend.stdout.on("data", d => {
    console.log(d.toString());
  });
  backend.stderr.on("data", d => {
    console.error(d.toString());
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });
  
  win.loadFile(path.join(__dirname, "../dist/index.html"));
  
  // เพิ่มบรรทัดนี้เข้าไปใต้ win.loadFile
  win.webContents.openDevTools();
}

ipcMain.handle("select-iso", async () => {
  const result = await dialog.showOpenDialog({
    filters: [{ name: "ISO", extensions: ["iso"] }],
    properties: ["openFile"]
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

app.whenReady().then(() => {
  startBackend();
  setTimeout(() => {
    createWindow();
  }, 2000);
});

app.on("will-quit", () => {
  if (backend) backend.kill();
});
