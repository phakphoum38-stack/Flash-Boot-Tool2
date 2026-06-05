import { useState, useEffect } from "react"

export default function App() {

  const [mode, setMode] = useState("dd")
  const [isoPath, setIsoPath] = useState("")
  const [device, setDevice] = useState("")
  const [usbDevices, setUsbDevices] = useState([])

  const [progress, setProgress] = useState(0)
  const [verifyProgress, setVerifyProgress] = useState(0)
  const [status, setStatus] = useState("idle")
  const [logs, setLogs] = useState([])
  const [isPaused, setIsPaused] = useState(false)

  const isFlashing = status === "flashing"

  // =========================
  // LOAD USB
  // =========================
  useEffect(() => {
    loadUsb()

    const unsub = window.electronAPI.onFlashEvent((event) => {

      if (event.type === "progress") setProgress(event.value)
      if (event.type === "verify_progress") setVerifyProgress(event.value)

      if (event.type === "log") addLog(event.msg)

      if (event.type === "error") {
        setStatus("error")
        addLog(event.msg)
      }

      if (event.type === "result") {
        setStatus(event.success ? "done" : "error")
      }

      if (event.type === "cancelled") setStatus("idle")
      if (event.type === "paused") setIsPaused(true)
      if (event.type === "resumed") setIsPaused(false)
    })

    return () => unsub()
  }, [])

  const loadUsb = async () => {
    const list = await window.electronAPI.getUsbDevices()
    setUsbDevices(list)
  }

  const addLog = (msg) => {
    setLogs(prev => [...prev, msg])
  }

  // =========================
  // FIXED SELECT ISO
  // =========================
  const handleSelectIso = async () => {
    console.log("CLICK ISO")

    const file = await window.electronAPI.selectIso()

    console.log("ISO:", file)

    if (file) {
      setIsoPath(file)
      addLog("Selected: " + file)
    }
  }

  const handleFlash = async () => {
    if (!isoPath || !device) return alert("เลือกก่อน")

    setStatus("flashing")
    setProgress(0)

    await window.electronAPI.flashIso(mode, isoPath, device)
  }

  return (
    <div style={{ padding: 20 }}>

      <h2>Flash Tool</h2>

      <input value={isoPath} readOnly />

      <button onClick={handleSelectIso}>
        Browse ISO
      </button>

      <select value={device} onChange={e => setDevice(e.target.value)}>
        <option value="">-- USB --</option>
        {usbDevices.map(u => (
          <option key={u.path} value={u.path}>
            {u.name}
          </option>
        ))}
      </select>

      <button onClick={handleFlash}>
        START
      </button>

      <div>Progress: {progress}%</div>

      <div>
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

    </div>
  )
}
