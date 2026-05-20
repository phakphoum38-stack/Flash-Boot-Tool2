import { ipcMain, dialog } from 'electron'
import { spawn } from 'child_process'
import path from 'path'
import { dialog } from 'electron'
import fs from 'fs'
import drivelist from 'drivelist'

const backendExe = path.join(process.resourcesPath, 'backend', 'backend.exe')

ipcMain.handle('flash-iso', async (event, mode, isoPath, device) => {
  return new Promise((resolve, reject) => {
    const proc = spawn(backendExe, ['flash', mode, isoPath, device])
    
    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean)
      for (const line of lines) {
        try {
          const msg = JSON.parse(line)
          event.sender.send('flash-event', msg)
          
          if (msg.type === 'result') resolve(msg)
          if (msg.type === 'error') reject(new Error(msg.msg))
        } catch {}
      }
    })
    
    proc.stderr.on('data', (data) => {
      event.sender.send('flash-event', { 
        type: 'error', 
        msg: data.toString() 
      })
    })
    
    proc.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Backend exited with code ${code}`))
    })
  })
})

let flashProcess: ChildProcessWithoutNullStreams | null = null

ipcMain.handle('flash-iso', async (event, mode, isoPath, device) => {
  return new Promise((resolve, reject) => {
    flashProcess = spawn(backendExe, ['flash', mode, isoPath, device])
    
    flashProcess.stdout.on('data', (data) => {
      // ... parse JSON ส่งไป frontend
    })
    
    flashProcess.on('exit', (code) => {
      flashProcess = null
      if (code === 0) resolve({success: true})
      else reject(new Error(`Exit code ${code}`))
    })
  })
})

ipcMain.handle('cancel-flash', async () => {
  if (flashProcess) {
    flashProcess.kill('SIGTERM')  // ส่งสัญญาณให้ backend หยุด
    flashProcess = null
  }
})

ipcMain.handle('pause-flash', async () => {
  if (flashProcess) {
    flashProcess.kill('SIGSTOP')  // pause บน Linux/Mac
    // บน Windows ใช้ suspend process API แทน
  }
})

ipcMain.handle('select-iso', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'ISO Files', extensions: ['iso'] }]
  })
  return filePaths[0]
})

ipcMain.handle('get-usb-devices', async () => {
  const devices = await drivelist.list()
  return devices
   .filter(d => d.isUSB &&!d.isSystem)
   .map(d => ({
      path: d.device,
      name: d.description,
      size: d.size
    }))
})

ipcMain.handle('get-file-size', async (_, path) => {
  const stats = fs.statSync(path)
  return stats.size
})
