const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

let mainWindow = null;
let flashProc = null;

// =========================
// BACKEND PATH
// =========================
function getBackendPath() {
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,
      "backend",
      "backend.exe"
    );
  }

  return path.join(
    __dirname,
    "../../backend/dist/backend.exe"
  );
}

// =========================
// WINDOW
// =========================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(
        __dirname,
        "preload.js"
      ),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl =
    process.env.VITE_DEV_SERVER_URL;

  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(
      path.join(
        __dirname,
        "../dist/index.html"
      )
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

    const parsed =
      JSON.parse(output);

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
          properties: ["openFile"],
          filters: [
            {
              name: "ISO",
              extensions: [
                "iso",
                "img",
              ],
            },
          ],
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
    try {
      console.log(
        "FLASH REQUEST"
      );

      console.log({
        mode,
        iso,
        device,
      });

      const backend =
        getBackendPath();

      console.log(
        "Backend Path:",
        backend
      );

      console.log(
        "Backend Exists:",
        fs.existsSync(
          backend
        )
      );

      if (
        !fs.existsSync(backend)
      ) {
        const msg =
          `Backend missing: ${backend}`;

        console.error(msg);

        event.sender.send(
          "flash-event",
          {
            type: "error",
            msg,
          }
        );

        return {
          success: false,
        };
      }

      flashProc = spawn(
        backend,
        [
          mode,
          iso,
          device,
        ],
        {
          windowsHide: true,
        }
      );

      let buffer = "";

      flashProc.stdout.on(
        "data",
        (data) => {
          const chunk =
            data.toString();

          console.log(
            "STDOUT:",
            chunk
          );

          buffer += chunk;

          const lines =
            buffer.split("\n");

          buffer =
            lines.pop() || "";

          for (const line of lines) {
            const msg =
              line.trim();

            if (
              msg.startsWith(
                "PROGRESS:"
              )
            ) {
              event.sender.send(
                "flash-event",
                {
                  type:
                    "progress",
                  value: Number(
                    msg.split(
                      ":"
                    )[1]
                  ),
                }
              );
            } else if (
              msg.startsWith(
                "VERIFY:"
              )
            ) {
              event.sender.send(
                "flash-event",
                {
                  type:
                    "verify",
                  value: Number(
                    msg.split(
                      ":"
                    )[1]
                  ),
                }
              );
            } else if (
              msg.startsWith(
                "LOG:"
              )
            ) {
              event.sender.send(
                "flash-event",
                {
                  type: "log",
                  msg: msg
                    .replace(
                      "LOG:",
                      ""
                    )
                    .trim(),
                }
              );
            } else {
              event.sender.send(
                "flash-event",
                {
                  type: "log",
                  msg,
                }
              );
            }
          }
        }
      );

      flashProc.stderr.on(
        "data",
        (data) => {
          const msg =
            data.toString();

          console.error(
            "STDERR:",
            msg
          );

          event.sender.send(
            "flash-event",
            {
              type: "error",
              msg,
            }
          );
        }
      );

      flashProc.on(
        "error",
        (err) => {
          console.error(
            "SPAWN ERROR:",
            err
          );

          event.sender.send(
            "flash-event",
            {
              type: "error",
              msg:
                err.message,
            }
          );
        }
      );

      flashProc.on(
        "close",
        (code) => {
          console.log(
            "EXIT CODE:",
            code
          );

          event.sender.send(
            "flash-event",
            {
              type: "log",
              msg:
                "Exit Code: " +
                code,
            }
          );

          event.sender.send(
            "flash-event",
            {
              type: "result",
              success:
                code === 0,
            }
          );

          flashProc = null;
        }
      );

      return {
        success: true,
      };
    } catch (err) {
      console.error(
        "FLASH ERROR:",
        err
      );

      event.sender.send(
        "flash-event",
        {
          type: "error",
          msg:
            err?.message ||
            String(err),
        }
      );

      return {
        success: false,
      };
    }
  }
);

// =========================
// CANCEL
// =========================
ipcMain.handle(
  "cancel-flash",
  async () => {
    if (flashProc) {
      flashProc.kill();

      flashProc = null;

      mainWindow?.webContents.send(
        "flash-event",
        {
          type:
            "cancelled",
        }
      );
    }

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
