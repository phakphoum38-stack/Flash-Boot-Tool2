import { ipcMain, dialog } from 'electron'
import { spawn } from 'child_process'
import path from 'path'

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
