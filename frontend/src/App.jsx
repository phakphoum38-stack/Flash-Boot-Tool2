import { useState, useEffect } from 'react'

function App() {
  const [isoPath, setIsoPath] = useState('')
  const [device, setDevice] = useState('')
  const [usbDevices, setUsbDevices] = useState([]) // เพิ่มตรงนี้
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    // โหลดรายชื่อ USB ตอนเปิดแอพ
    window.electron.getUsbDevices().then(setUsbDevices)
    
    window.electron.onFlashProgress(setProgress)
    window.electron.onFlashError((err) => {
      setStatus('error')
      alert('Error: ' + err)
    })
    return () => {
      window.electron.removeAllListeners('flash-progress')
      window.electron.removeAllListeners('flash-error')
    }
  }, [])

  const handleFlash = async () => {
    if (!isoPath || !device) return alert('เลือกไฟล์ ISO และ Device ก่อน')
    setStatus('flashing')
    setProgress(0)
    const res = await window.electron.flashIso(isoPath, device)
    setStatus(res.success ? 'done' : 'error')
    if (res.success) alert('Flash เสร็จแล้ว!')
  }

  const handleSelectIso = async () => {
    const filePath = await window.electron.selectIsoFile()
    if (filePath) {
      setIsoPath(filePath)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Flash Boot Tool</h2>
      
      <div>
        <label>ISO File:</label>
        <input 
          type="text" 
          value={isoPath} 
          readOnly 
          style={{ width: 300, margin: '0 10px' }} 
        />
        <button onClick={handleSelectIso}>Browse</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <label>USB Device:</label>
        <select 
          value={device} 
          onChange={(e) => setDevice(e.target.value)}
          style={{ marginLeft: 10, width: 350 }}
        >
          <option value="">-- เลือก USB --</option>
          {usbDevices.map(d => (
            <option key={d.path} value={d.path}>
              {d.name} ({(d.size / 1024 / 1024 / 1024).toFixed(1)} GB) - {d.path}
            </option>
          ))}
        </select>
      </div>

      <button 
        onClick={handleFlash} 
        disabled={status === 'flashing'} 
        style={{ marginTop: 20 }}
      >
        {status === 'flashing' ? 'Flashing...' : 'Start Flash'}
      </button>

      {status === 'flashing' && (
        <div style={{ marginTop: 20 }}>
          <div style={{ border: '1px solid #ccc', height: 20 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'green' }} />
          </div>
          <p>{progress}%</p>
        </div>
      )}

      {status === 'done' && <p style={{ color: 'green' }}>สำเร็จ!</p>}
    </div>
  )
}

export default App

const [isPaused, setIsPaused] = useState(false)

const handleCancel = async () => {
  await window.electron.cancelFlash()
}

const handlePause = async () => {
  if (isPaused) {
    await window.electron.resumeFlash()
  } else {
    await window.electron.pauseFlash()
  }
  setIsPaused(!isPaused)
}
