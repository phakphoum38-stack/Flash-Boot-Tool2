ipcMain.handle("flash", async (event, mode, iso, device) => {

  const backend = getBackendPath()

  flashProc = spawn(backend, [mode, iso, device], {
    windowsHide: true,
    shell: false
  })

  let buffer = ""
  const MAX = 128 * 1024

  flashProc.stdout.on("data", d => {

    buffer += d.toString()

    if (buffer.length > MAX) {
      buffer = buffer.slice(-MAX)
    }

    const lines = buffer.split("\n")
    buffer = lines.pop()

    for (const line of lines) {

      const msg = line.trim()

      // PROGRESS
      if (msg.startsWith("PROGRESS:")) {
        safeSend(mainWindow, "progress", {
          value: Number(msg.split(":")[1])
        })
      }

      // SPEED (NEW)
      else if (msg.startsWith("SPEED:")) {
        safeSend(mainWindow, "speed", {
          value: Number(msg.split(":")[1])
        })
      }

      // VERIFY
      else if (msg.startsWith("VERIFY:")) {
        safeSend(mainWindow, "verify", {
          value: Number(msg.split(":")[1])
        })
      }

      // LOG
      else {
        safeSend(mainWindow, "log", { msg })
      }
    }
  })

  flashProc.on("close", code => {
    safeSend(mainWindow, "result", {
      success: code === 0
    })
  })

  return { ok: true }
})
