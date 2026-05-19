const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

let backend;

// pfunction startBackend() {

  let exePath;

  if (app.isPackaged) {
    exePath = path.join(process.resourcesPath, "backend", "backend.exe");
  } else {
    exePath = path.join(__dirname, "../../backend/dist/backend.exe");
  }

  console.log("Backend:", exePath);

  backend = spawn(exePath, [], {
    windowsHide: true
  });

  backend.stdout.on("data", d => {
    console.log(d.toString());
  });

  backend.stderr.on("data", d => {
    console.error(d.toString());
  });
}

// p
% WINDOW
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
}

// pipcMain.handle("select-iso", async () => {

  const result = await dialog.showOpenDialog({
    filters: [
      {
        name: "ISO",
        extensions: ["iso"]
      }
    ],
    properties: ["openFile"]
  });

  if (result.canceled) return null;

  return result.filePaths[0];
});

// papp.whenReady().then(() => {

  startBackend();

  setTimeout(() => {
    createWindow();
  }, 2000);
});

// papp.on("will-quit", () => {
  if (backend) backend.kill();
});
const { dialog } = require('electron');
ipcMain.handle('select-iso-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'ISO', extensions: ['iso'] }]
  });
  return canceled? null : filePaths[0];
});
