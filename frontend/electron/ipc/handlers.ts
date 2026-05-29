import { ipcMain } from 'electron'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import path from 'path'
import fs from 'fs'

let flashProcess: ChildProcessWithoutNullStreams | null = null

// =========================
// Backend / Ventoy Paths
// =========================
const backendExe = process.env.NODE_ENV === 'development'
  ? path.join(__dirname, '../../../backend/dist/backend.exe')
  : path.join(process.resourcesPath, 'backend', 'backend.exe')

const ventoyExe = process.env.NODE_ENV === 'development'
  ? path.join(__dirname, '../../../backend/flash_tool/resources/ventoy/Ventoy2Disk.exe')
  : path.join(process.resourcesPath, 'ventoy', 'Ventoy2Disk.exe')

console.log('==========================')
console.log('Backend EXE:', backendExe)
console.log('Backend Exists:', fs.existsSync(backendExe))

console.log('Ventoy EXE:', ventoyExe)
console.log('Ventoy Exists:', fs.existsSync(ventoyExe))

console.log('Resources Path:', process.resourcesPath)
console.log('==========================')

// =========================
// Flash ISO
// =========================
ipcMain.handle(
  'flash-iso',
  async (event, mode: string, isoPath: string, device: string) => {

    return new Promise((resolve, reject) => {

      // เช็ก backend.exe
      if (!fs.existsSync(backendExe)) {
        reject(
          new Error(`backend.exe not found:\n${backendExe}`)
        )
        return
      }

      // args
      const args = ['flash', mode, isoPath, device]

      // Ventoy mode
      if (mode === 'ventoy') {

        if (!fs.existsSync(ventoyExe)) {
          reject(
            new Error(`Ventoy2Disk.exe not found:\n${ventoyExe}`)
          )
          return
        }

        args.push(ventoyExe)
      }

      console.log('FLASH COMMAND:')
      console.log(backendExe)
      console.log(args)

      // Spawn backend
      flashProcess = spawn(
        backendExe,
        args,
        {
          windowsHide: true
        }
      )

      // =========================
      // STDOUT
      // =========================
      flashProcess.stdout.on('data', (data) => {

        const lines = data
          .toString()
          .split('\n')
          .filter(Boolean)

        for (const line of lines) {

          console.log('BACKEND:', line)

          try {

            const msg = JSON.parse(line)

            // ส่งไป renderer
            event.sender.send(
              'flash-event',
              msg
            )

            // success
            if (msg.type === 'result') {
              resolve(msg)
            }

            // error
            if (msg.type === 'error') {
              reject(
                new Error(msg.msg)
              )
            }

          } catch (e) {

            console.error(
              'JSON Parse Error:',
              line
            )
          }
        }
      })

      // =========================
      // STDERR
      // =========================
      flashProcess.stderr.on('data', (data) => {

        const err = data.toString()

        console.error('BACKEND STDERR:', err)

        event.sender.send(
          'flash-event',
          {
            type: 'error',
            msg: err
          }
        )
      })

      // =========================
      // EXIT
      // =========================
      flashProcess.on('exit', (code) => {

        console.log('Backend Exit:', code)

        flashProcess = null

        if (code !== 0 && code !== null) {

          reject(
            new Error(
              `Backend exited with code ${code}`
            )
          )
        }
      })

      // =========================
      // SPAWN ERROR
      // =========================
      flashProcess.on('error', (err) => {

        console.error('SPAWN ERROR:', err)

        reject(err)
      })
    })
  }
)

// =========================
// Cancel Flash
// =========================
ipcMain.handle('cancel-flash', async () => {

  if (flashProcess) {

    flashProcess.kill('SIGTERM')

    flashProcess = null

    console.log('Flash cancelled')
  }
})
