const { ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

ipcMain.handle('flash-iso', async (event, isoPath, device) => {
  const backendPath = path.join(process.resourcesPath, 'backend', 'backend.exe');

  return new Promise((resolve) => {
    const proc = spawn(backendPath, ['flash', isoPath, device]);

    proc.stdout.on('data', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.progress!== undefined) {
          event.sender.send('flash-progress', msg.progress);
        }
      } catch {}
    });

    proc.stderr.on('data', (data) => {
      event.sender.send('flash-error', data.toString());
    });

    proc.on('close', (code) => {
      resolve({ success: code === 0 });
    });
  });
});
