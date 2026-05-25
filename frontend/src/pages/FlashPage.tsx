import { useState, useEffect } from 'react'

export default function FlashPage() {
  const [isoPath, setIsoPath] = useState('')
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const [mode, setMode] = useState('dd')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    loadDevices()
    window.electronAPI.onFlashEvent((event) => {
      if (event.type === 'progress') setProgress(event.value)
      if (event.type === 'result') {
        setStatus(event.success ? 'success' : 'failed')
        setMsg(event.message || '')
      }
      if (event.type === 'paused') setStatus('paused')
      if (event.type === 'resumed') setStatus('flashing')
      if (event.type === 'cancelled') {
        setStatus('idle')
        setProgress(0)
        setMsg('ยกเลิกแล้ว')
      }
    })
  }, [])

  const loadDevices = async () => {
    const devs = await window.electronAPI.getUsbDevices()
    setDevices(devs)
  }

  const selectIso = async () => {
    const path = await window.electronAPI.selectIso()
    if (path) setIsoPath(path)
  }

  const startFlash = async () => {
    if (!isoPath || !selectedDevice) return
    setStatus('flashing')
    setProgress(0)
    setMsg('')
    await window.electronAPI.flashIso(mode, isoPath, selectedDevice)
  }

  const pauseFlash = () => window.electronAPI.pauseFlash()
  const resumeFlash = () => window.electronAPI.resumeFlash()
  const cancelFlash = () => window.electronAPI.cancelFlash()

  return (
    <div style={{padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto'}}>
      <h1>Flash Boot Tool</h1>
      
      <button onClick={selectIso} style={{padding: '8px 16px', marginBottom: '10px'}}>
        Select ISO
      </button>
      <p style={{wordBreak: 'break-all'}}>{isoPath || 'ยังไม่ได้เลือกไฟล์ ISO'}</p>

      <label>โหมด Flash:</label>
      <select 
        value={mode} 
        onChange={(e) => setMode(e.target.value)}
        style={{padding: '8px', width: '100%', marginBottom: '10px'}}
      >
        <option value="dd">DD Mode - เร็ว, เขียนตรงๆ</option>
        <option value="smart">Smart Mode - ตรวจสอบก่อนเขียน</option>
        <option value="ventoy">Ventoy Mode - ทำ Ventoy USB</option>
      </select>

      <label>เลือก USB:</label>
      <select 
        value={selectedDevice} 
        onChange={(e) => setSelectedDevice(e.target.value)}
        style={{padding: '8px', width: '100%', marginBottom: '10px'}}
      >
        <option value="">เลือก USB</option>
        {devices.map(d => (
          <option key={d.path} value={d.path}>
            {d.name} - {(d.size / 1024 / 1024 / 1024).toFixed(1)}GB
          </option>
        ))}
      </select>

      <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
        <button 
          onClick={startFlash} 
          disabled={!isoPath || !selectedDevice || status === 'flashing'}
          style={{padding: '10px 20px', flex: 1}}
        >
          {status === 'flashing' ? `กำลัง Flash... ${progress}%` : 'Start Flash'}
        </button>

        {status === 'flashing' && (
          <>
            <button onClick={pauseFlash} style={{padding: '10px 20px'}}>Pause</button>
            <button onClick={cancelFlash} style={{padding: '10px 20px', background: '#ff4d4d', color: 'white'}}>Cancel</button>
          </>
        )}

        {status === 'paused' && (
          <>
            <button onClick={resumeFlash} style={{padding: '10px 20px', background: '#4CAF50', color: 'white'}}>Resume</button>
            <button onClick={cancelFlash} style={{padding: '10px 20px', background: '#ff4d4d', color: 'white'}}>Cancel</button>
          </>
        )}
      </div>

      {progress > 0 && (
        <div style={{background: '#eee', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px'}}>
          <div style={{width: `${progress}%`, background: '#4CAF50', height: '20px', transition: 'width 0.3s'}}></div>
        </div>
      )}

      {status === 'success' && <p style={{color: 'green'}}>✅ Flash สำเร็จ! {msg}</p>}
      {status === 'failed' && <p style={{color: 'red'}}>❌ Flash ไม่สำเร็จ! {msg}</p>}
      {status === 'paused' && <p style={{color: 'orange'}}>⏸️ หยุดชั่วคราว</p>}
    </div>
  )
}
