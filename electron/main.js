import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let flashTimer = null;
let verifyTimer = null;

console.log("ELECTRON MAIN LOADED");

// =========================
// WINDOW
// =========================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;

  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "../dist/index.html")
    );
  }

  mainWindow.webContents.openDevTools();
}

// =========================
// USB CACHE
// =========================
let usbCache = [];
let lastUsbTime = 0;

async function getUsbDevices() {
  const now = Date.now();

  if (now - lastUsbTime < 2000) {
    return usbCache;
  }

  try {
    const cmd =
      `powershell -NoProfile "Get-CimInstance Win32_DiskDrive | Where-Object {$_.InterfaceType -eq 'USB'} | Select DeviceID,Model,Size | ConvertTo-Json"`;

    const output = execSync(cmd)
      .toString()
      .trim();

    if (!output) {
      return [];
    }

    const parsed = JSON.parse(output);
    const arr = Array.isArray(parsed)
      ? parsed
      : [parsed];

    usbCache = arr.map((d) => ({
      path: d.DeviceID,
      name: d.Model || "USB Device",
      size: Number(d.Size || 0),
    }));

    lastUsbTime = now;

    return usbCache;
  } catch (err) {
    console.error("USB SCAN ERROR:", err);
    return [];
  }
}

// =========================
// IPC USB
// =========================
ipcMain.handle("get-usb-devices", async () => {
  return await getUsbDevices();
});

// =========================
// IPC ISO
// =========================
ipcMain.handle("select-iso", async () => {
  const result = await dialog.showOpenDialog(
    mainWindow,
    {
      properties: ["openFile"],
      filters: [
        {
          name: "ISO Files",
          extensions: ["iso", "img"],
        },
      ],
    }
  );

  return result.canceled
    ? null
    : result.filePaths[0];
});

// =========================
// FLASH ISO (MOCK)
// =========================
ipcMain.handle(
  "flash-iso",
  async (event, mode, iso, device) => {
    console.log("FLASH START");

    console.log({
      mode,
      iso,
      device,
    });

    let progress = 0;
    let verify = 0;

    flashTimer = setInterval(() => {
      progress += 5;

      event.sender.send("flash-event", {
        type: "progress",
        value: progress,
      });

      event.sender.send("flash-event", {
        type: "speed",
        value: Number(
          (
            25 +
            Math.random() * 75
          ).toFixed(1)
        ),
      });

      event.sender.send("flash-event", {
        type: "log",
        msg: `Writing... ${progress}%`,
      });

      if (progress >= 100) {
        clearInterval(flashTimer);

        verifyTimer = setInterval(() => {
          verify += 10;

          event.sender.send(
            "flash-event",
            {
              type: "verify",
              value: verify,
            }
          );

          event.sender.send(
            "flash-event",
            {
              type: "log",
              msg: `Verify... ${verify}%`,
            }
          );

          if (verify >= 100) {
            clearInterval(
              verifyTimer
            );

            event.sender.send(
              "flash-event",
              {
                type: "log",
                msg: "Flash Complete",
              }
            );

            event.sender.send(
              "flash-event",
              {
                type: "result",
                success: true,
              }
            );
          }
        }, 300);
      }
    }, 200);

    return {
      success: true,
    };
  }
);

// =========================
// CANCEL
// =========================
ipcMain.handle(
  "cancel-flash",
  async () => {
    if (flashTimer) {
      clearInterval(flashTimer);
      flashTimer = null;
    }

    if (verifyTimer) {
      clearInterval(verifyTimer);
      verifyTimer = null;
    }

    mainWindow?.webContents.send(
      "flash-event",
      {
        type: "cancelled",
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
