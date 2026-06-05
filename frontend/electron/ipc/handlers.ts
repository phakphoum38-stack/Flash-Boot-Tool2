import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'

let mainWindow: BrowserWindow | null = null
let flashProcess: ChildProcessWithoutNullStreams | null = null

// =========================
// CREATE WINDOW
// =========================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.loadURL('http://localhost:5173')
}

app.whenReady().then(createWindow)

// =========================
// SELECT ISO
// =========================
ipcMain.handle('select-iso', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select ISO File',
    properties: ['openFile'],
    filters: [
      { name: 'ISO Files', extensions: ['iso', 'img'] }
    ]
  })

  if (result.canceled) return null
  return result.filePaths[0]
})

// =========================
// GET USB DEVICES (mock ถ้ายังไม่มี backend)
// =========================
ipcMain.handle('get-usb-devices', async () => {
  return [
    { name: 'USB Drive 1', path: 'E:/', size: 32000000000 },
    { name: 'USB Drive 2', path: 'F:/', size: 64000000000 }
  ]
})

// =========================
// FLASH ISO (mock backend integration)
// =========================
ipcMain.handle('flash-iso', async (event, mode, isoPath, device) => {
  return new Promise((resolve) => {

    console.log('FLASH START:', mode, isoPath, device)

    let progress = 0

    flashProcess = setInterval(() => {

      progress += 5

      mainWindow?.webContents.send('flash-event', {
        type: 'progress',
        value: progress
      })

      mainWindow?.webContents.send('flash-event', {
        type: 'log',
        msg: `Writing... ${progress}%`
      })

      if (progress >= 100) {

        clearInterval(flashProcess as any)
        flashProcess = null

        const result = {
          type: 'result',
          success: true
        }

        mainWindow?.webContents.send('flash-event', result)
        resolve(result)
      }

    }, 200)
  })
})

// =========================
// CANCEL
// =========================
ipcMain.handle('cancel-flash', async () => {

  if (flashProcess) {
    clearInterval(flashProcess as any)
    flashProcess = null

    mainWindow?.webContents.send('flash-event', {
      type: 'cancelled'
    })
  }
})
