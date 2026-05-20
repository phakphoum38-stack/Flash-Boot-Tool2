import { useState, useEffect } from 'react'

function App() {
  const [isoPath, setIsoPath] = useState('')
  const [device, setDevice] = useState('')
  const [usbDevices, setUsbDevices] = useState([])
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    // โหลดรายชื่อ USB ตอนเปิดแอพ
    window.electron.getUsbDevices().then(setUsbDevices)
    window.electron.onFlashProgress(setProgress)
    window.electron.onFlashError((err) => {
      setStatus('error')
      setIsPaused(false)
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
    setIsPaused(false)
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

  const handleCancel = async () => {
    await window.electron.cancelFlash()
    setStatus('idle')
    setProgress(0)
    setIsPaused(false)
  }

  const handlePause = async () => {
    if (isPaused) {
      await window.electron.resumeFlash()
    } else {
      await window.electron.pauseFlash()
    }
    setIsPaused(!isPaused)
  }

  const isFlashing = status === 'flashing'

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>Flash Boot Tool</h2>
      
      <div>
        <label>ISO File:</label>
        <input 
          type="text" 
          value={isoPath} 
          readOnly 
          style={{ width: 300, margin: '0 10px' }} 
          disabled={isFlashing}
        />
        <button onClick={handleSelectIso} disabled={isFlashing}>Browse</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <label>USB Device:</label>
        <select 
          value={device} 
          onChange={(e) => setDevice(e.target.value)} 
          style={{ marginLeft: 10, width: 350 }}
          disabled={isFlashing}
        >
          <option value="">-- เลือก USB --</option>
          {usbDevices.map(d => (
            <option key={d.path} value={d.path}>
              {d.name} ({(d.size / 1024 / 1024 / 1024).toFixed(1)} GB) - {d.path}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 20 }}>
        <button 
          onClick={handleFlash} 
          disabled={isFlashing || !isoPath || !device}
          style={{ padding: '8px 16px' }}
        >
          {isFlashing ? 'Flashing...' : 'Start Flash'}
        </button>

        {isFlashing && (
          <>
            <button 
              onClick={handlePause} 
              style={{ marginLeft: 10, padding: '8px 16px' }}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button 
              onClick={handleCancel} 
              style={{ marginLeft: 10, padding: '8px 16px', color: 'red' }}
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {isFlashing && (
        <div style={{ marginTop: 20 }}>
          <div style={{ border: '1px solid #ccc', height: 20, width: 400 }}>
            <div 
              style={{ 
                width: `${progress}%`, 
                height: '100%', 
                background: isPaused ? 'orange' : 'green',
                transition: 'width 0.3s'
              }} 
            />
          </div>
          <p>{progress}% {isPaused && '(Paused)'}</p>
        </div>
      )}

      {status === 'done' && <p style={{ color: 'green', marginTop: 20 }}>สำเร็จ! ถอด USB ไปใช้งานได้เลย</p>}
      {status === 'error' && <p style={{ color: 'red', marginTop: 20 }}>เกิดข้อผิดพลาด</p>}
    </div>
  )
}

export default App
