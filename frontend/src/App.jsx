import { useState, useEffect } from 'react'

export default function App() {

  const [mode, setMode] = useState('dd')
  const [isoPath, setIsoPath] = useState('')
  const [device, setDevice] = useState('')
  const [usbDevices, setUsbDevices] = useState([])

  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [logs, setLogs] = useState([])

  // =========================
  // LOAD USB
  // =========================
  useEffect(() => {
    loadUsb()
  }, [])

  const loadUsb = async () => {
    const data = await window.electronAPI.getUsbDevices()
    setUsbDevices(data)
  }

  // =========================
  // LOG
  // =========================
  const addLog = (msg) => {
    setLogs(prev => [...prev, msg])
  }

  // =========================
  // SELECT ISO (FIXED)
  // =========================
  const handleSelectIso = async () => {

    console.log("CLICK BROWSE")

    const file = await window.electronAPI.selectIso()

    if (!file) return

    setIsoPath(file)
    addLog("Selected: " + file)
  }

  // =========================
  // FLASH
  // =========================
  const handleFlash = async () => {

    if (!isoPath || !device)
      return alert("เลือก ISO + USB ก่อน")

    setStatus('flashing')
    setProgress(0)
    setLogs([])

    await window.electronAPI.flashIso(
      mode,
      isoPath,
      device
    )
  }

  // =========================
  // EVENT LISTENER
  // =========================
  useEffect(() => {

    const unsubscribe =
      window.electronAPI.onFlashEvent((e) => {

        if (e.type === 'progress')
          setProgress(e.value)

        if (e.type === 'log')
          addLog(e.msg)

        if (e.type === 'result') {
          setStatus('done')
          addLog("DONE")
        }

        if (e.type === 'cancelled') {
          setStatus('idle')
          setProgress(0)
        }
      })

    return () => unsubscribe()

  }, [])

  return (
    <div style={{ padding: 20 }}>

      <h2>Flash Tool</h2>

      {/* ISO */}
      <input value={isoPath} readOnly />
      <button onClick={handleSelectIso}>
        Browse ISO
      </button>

      {/* USB */}
      <select onChange={(e) => setDevice(e.target.value)}>
        <option value="">Select USB</option>
        {usbDevices.map(d => (
          <option key={d.path} value={d.path}>
            {d.name}
          </option>
        ))}
      </select>

      {/* FLASH */}
      <button onClick={handleFlash}>
        START
      </button>

      {/* PROGRESS */}
      <div>Progress: {progress}%</div>

      {/* LOGS */}
      <pre>
        {logs.join('\n')}
      </pre>

    </div>
  )
}
