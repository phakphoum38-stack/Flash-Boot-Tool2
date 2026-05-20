import { ipcMain } from 'electron'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import path from 'path'

let flashProcess: ChildProcessWithoutNullStreams | null = null

// path ของ backend.exe ตอน build แล้ว
const backendExe = path.join(process.resourcesPath, 'backend', 'backend.exe')

ipcMain.handle('flash-iso', async (event, mode: string, isoPath: string, device: string) => {
  return new Promise((resolve, reject) => {
    
    // 1. Spawn backend process
    flashProcess = spawn(backendExe, ['flash', mode, isoPath, device])
    
    // 2. อ่าน stdout ที่ backend print json ออกมา
    flashProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean)
      
      for (const line of lines) {
        try {
          const msg = JSON.parse(line)
          
          // 3. ส่งต่อให้ renderer ผ่าน event
          event.sender.send('flash-event', msg)
          
          // 4. จบงาน
          if (msg.type === 'result') {
            resolve(msg)
          }
          if (msg.type === 'error') {
            reject(new Error(msg.msg))
          }
        } catch (e) {
          console.error('Failed to parse backend output:', line)
        }
      }
    })
    
    // 5. อ่าน stderr เผื่อ error
    flashProcess.stderr.on('data', (data) => {
      event.sender.send('flash-event', { 
        type: 'error', 
        msg: data.toString() 
      })
    })
    
    // 6. จัดการ process exit
    flashProcess.on('exit', (code) => {
      flashProcess = null
      if (code !== 0 && code !== null) {
        reject(new Error(`Backend exited with code ${code}`))
      }
    })
    
    // 7. จัดการ error ตอน spawn
    flashProcess.on('error', (err) => {
      reject(err)
    })
  })
})

// สำหรับ cancel
ipcMain.handle('cancel-flash', async () => {
  if (flashProcess) {
    flashProcess.kill('SIGTERM')
    flashProcess = null
  }
})
