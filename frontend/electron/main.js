const { app, BrowserWindow, ipcMain, dialog } = require("electron")
const { spawn } = require("child_process")
const path = require("path")
const fs = require("fs")

let mainWindow = null
let backendProc = null
let flashProc = null

// =========================
// BACKEND PATH
// =========================
function getBackendPath() {
  let backendPath;

  if (app.isPackaged) {
    backendPath = path.join(
      process.resourcesPath,
      "backend",
      "backend.exe"
    );
  } else {
    backendPath = path.resolve(
      __dirname,
      "../../backend/dist/backend.exe"
    );
  }

  console.log("BACKEND PATH =", backendPath);
  console.log(
    "BACKEND EXISTS =",
    fs.existsSync(backendPath)
  );

  return backendPath;
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
// USB CACHE (ลด lag)
// =========================
let usbCache = []
let lastUsbTime = 0

async function getUsbDevices() {
  const now = Date.now()
  if (now - lastUsbTime < 2000) return usbCache

  const { execSync } = require("child_process")

  try {
    const cmd = `powershell -NoProfile "Get-CimInstance Win32_DiskDrive | Where-Object {$_.InterfaceType -eq 'USB'} | Select DeviceID,Model,Size | ConvertTo-Json"`

    const out = execSync(cmd).toString().trim()
    if (!out) return []

    const data = JSON.parse(out)
    const arr = Array.isArray(data) ? data : [data]

    usbCache = arr.map(d => ({
      path: d.DeviceID,
      name: d.Model || "USB",
      size: Number(d.Size || 0)
    }))

    lastUsbTime = now
    return usbCache
  } catch {
    return []
  }
}

// =========================
// IPC: USB
// =========================
ipcMain.handle("get-usb-devices", async () => {
  return getUsbDevices()
})

// =========================
// IPC: ISO
// =========================
ipcMain.handle("select-iso", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "ISO", extensions: ["iso", "img"] }]
  })

  return result.canceled ? null : result.filePaths[0]
})

// =========================
// FLASH ENGINE (STREAM + EVENT BUS)
// =========================
ipcMain.handle(
  "flash-iso",
  async (event, mode, iso, device) => {
    try {
      const backend = getBackendPath();

      if (!fs.existsSync(backend)) {
        const msg =
          "backend.exe not found:\n" +
          backend;

        console.error(msg);

        event.sender.send(
          "flash-event",
          {
            type: "error",
            msg,
          }
        );

        event.sender.send(
          "flash-event",
          {
            type: "result",
            success: false,
          }
        );

        return {
          success: false,
          error: msg,
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
          buffer += data.toString();

          const lines =
            buffer.split(/\r?\n/);

          buffer =
            lines.pop() || "";

          for (const line of lines) {
            const msg =
              line.trim();

            console.log(
              "[BACKEND]",
              msg
            );

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
                "SPEED:"
              )
            ) {
              event.sender.send(
                "flash-event",
                {
                  type:
                    "speed",
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
            "[BACKEND ERROR]",
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

          event.sender.send(
            "flash-event",
            {
              type: "result",
              success: false,
            }
          );
        }
      );

      flashProc.on(
        "close",
        (code) => {
          console.log(
            "BACKEND EXIT:",
            code
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
      console.error(err);

      event.sender.send(
        "flash-event",
        {
          type: "error",
          msg:
            err.message ||
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
// CANCEL SAFE
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

app.whenReady().then(createWindow)
