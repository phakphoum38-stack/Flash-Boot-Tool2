console.log("MAIN LOADED");
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
// FLASH ISO (MOCK - แก้ไขแล้ว)
// =========================
ipcMain.handle(
  "flash-iso",
  async (event, mode, iso, device) => {
    console.log("FLASH START", { mode, iso, device });

    let progress = 0;
    let verify = 0;

    // จำลองการเขียน
    flashTimer = setInterval(() => {
      progress += 10;

      event.sender.send("flash-event", { type: "progress", value: progress });
      event.sender.send("flash-event", { type: "log", msg: `Writing... ${progress}%` });

      if (progress >= 100) {
        clearInterval(flashTimer);

        // จำลอง Verify
        verifyTimer = setInterval(() => {
          verify += 20;
          event.sender.send("flash-event", { type: "verify", value: verify });
          event.sender.send("flash-event", { type: "log", msg: `Verify... ${verify}%` });

          if (verify >= 100) {
            clearInterval(verifyTimer);
            event.sender.send("flash-event", { type: "log", msg: "✅ Flash Complete" });
            event.sender.send("flash-event", { type: "result", success: true });
          }
        }, 400);
      }
    }, 300);

    return { success: true };
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
// PAUSE & RESUME
// =========================
ipcMain.handle("pause-flash", async () => {
  if (flashTimer) {
    clearInterval(flashTimer);
    flashTimer = null;
  }
  mainWindow?.webContents.send("flash-event", { type: "paused" });
  return true;
});

ipcMain.handle("resume-flash", async () => {
  // ยังเป็น mock อยู่ ต่อยอดได้ภายหลัง
  mainWindow?.webContents.send("flash-event", { type: "resumed" });
  return true;
});

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
