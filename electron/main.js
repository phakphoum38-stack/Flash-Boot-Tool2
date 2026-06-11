console.log("ROOT MAIN LOADED");

import {
  app,
  BrowserWindow,
  ipcMain,
  dialog
} from "electron";

import {
  execSync,
  spawn
} from "child_process";

import path from "path";
import { fileURLToPath } from "url";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

let mainWindow = null;
let flashProcess = null;

console.log("ELECTRON MAIN LOADED");

// =========================
// WINDOW
// =========================
function createWindow() {

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(
        __dirname,
        "preload.js"
      ),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl =
    process.env.VITE_DEV_SERVER_URL;

  if (devUrl) {

    console.log(
      "DEV MODE =",
      devUrl
    );

    mainWindow.loadURL(devUrl);

    mainWindow.webContents.openDevTools();

  } else {

    const indexFile =
      app.isPackaged
        ? path.join(
            process.resourcesPath,
            "frontend",
            "index.html"
          )
        : path.join(
            __dirname,
            "..",
            "frontend-c",
            "dist",
            "index.html"
          );

    console.log(
      "PRODUCTION MODE"
    );

    console.log(
      "INDEX =",
      indexFile
    );

    mainWindow.loadFile(
      indexFile
    );
  }
}

// =========================
// USB CACHE
// =========================
let usbCache = [];
let lastUsbTime = 0;

async function getUsbDevices() {

  const now = Date.now();

  if (
    now - lastUsbTime < 2000
  ) {
    return usbCache;
  }

  try {

    const cmd =
      `powershell -NoProfile "Get-CimInstance Win32_DiskDrive | Where-Object {$_.InterfaceType -eq 'USB'} | Select DeviceID,Model,Size | ConvertTo-Json"`;

    const output =
      execSync(cmd)
        .toString()
        .trim();

    if (!output) {
      return [];
    }

    const parsed =
      JSON.parse(output);

    const arr =
      Array.isArray(parsed)
        ? parsed
        : [parsed];

    usbCache = arr.map(
      d => ({
        path: d.DeviceID,
        name:
          d.Model ||
          "USB Device",
        size: Number(
          d.Size || 0
        )
      })
    );

    lastUsbTime = now;

    return usbCache;

  } catch (err) {

    console.error(
      "USB SCAN ERROR:",
      err
    );

    return [];
  }
}

// =========================
// IPC USB
// =========================
ipcMain.handle(
  "get-usb-devices",
  async () => {
    return await getUsbDevices();
  }
);

// =========================
// IPC ISO
// =========================
ipcMain.handle(
  "select-iso",
  async () => {

    const result =
      await dialog.showOpenDialog(
        mainWindow,
        {
          properties: [
            "openFile"
          ],
          filters: [
            {
              name:
                "ISO Files",
              extensions: [
                "iso",
                "img"
              ]
            }
          ]
        }
      );

    return result.canceled
      ? null
      : result.filePaths[0];
  }
);

// =========================
// FLASH ISO
// =========================
ipcMain.handle(
  "flash-iso",
  async (
    event,
    mode,
    iso,
    device
  ) => {

    console.log(
      "FLASH START",
      {
        mode,
        iso,
        device
      }
    );

    const backendExe =
      app.isPackaged
        ? path.join(
            process.resourcesPath,
            "backend",
            "FlashTool.exe"
          )
        : path.join(
            __dirname,
            "..",
            "backend-cpp",
            "build",
            "Release",
            "FlashTool.exe"
          );

    console.log(
      "BACKEND =",
      backendExe
    );

    flashProcess =
      spawn(
        backendExe,
        [
          mode,
          iso,
          device
        ]
      );

    flashProcess.stdout.on(
      "data",
      data => {

        const msg =
          data.toString();

        console.log(msg);

        event.sender.send(
          "flash-event",
          {
            type: "log",
            msg
          }
        );

        const progressMatch =
          msg.match(
            /Writing\.\.\.\s*(\d+)/i
          );

        if (
          progressMatch
        ) {

          event.sender.send(
            "flash-event",
            {
              type:
                "progress",
              value: Number(
                progressMatch[1]
              )
            }
          );
        }

        const verifyMatch =
          msg.match(
            /Verify\.\.\.\s*(\d+)/i
          );

        if (
          verifyMatch
        ) {

          event.sender.send(
            "flash-event",
            {
              type:
                "verify",
              value: Number(
                verifyMatch[1]
              )
            }
          );
        }
      }
    );

    flashProcess.stderr.on(
      "data",
      data => {

        const msg =
          data.toString();

        console.error(msg);

        event.sender.send(
          "flash-event",
          {
            type: "log",
            msg
          }
        );
      }
    );

    flashProcess.on(
      "close",
      code => {

        console.log(
          "BACKEND EXIT",
          code
        );

        event.sender.send(
          "flash-event",
          {
            type:
              "result",
            success:
              code === 0
          }
        );

        flashProcess =
          null;
      }
    );

    return {
      success: true
    };
  }
);

// =========================
// CANCEL
// =========================
ipcMain.handle(
  "cancel-flash",
  async () => {

    if (
      flashProcess
    ) {

      flashProcess.kill();

      flashProcess =
        null;
    }

    mainWindow?.webContents.send(
      "flash-event",
      {
        type:
          "cancelled"
      }
    );

    return true;
  }
);

// =========================
// APP
// =========================
app.whenReady().then(
  createWindow
);

app.on(
  "window-all-closed",
  () => {

    if (
      process.platform !==
      "darwin"
    ) {

      app.quit();
    }
  }
);
