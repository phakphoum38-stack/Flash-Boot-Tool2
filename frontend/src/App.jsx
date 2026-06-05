import { useState, useEffect, useRef } from "react"

export default function App() {

  const [mode, setMode] = useState("dd")
  const [iso, setIso] = useState("")
  const [device, setDevice] = useState("")
  const [usb, setUsb] = useState([])
  const [logs, setLogs] = useState([])

  const targetProgress = useRef(0)
  const [progress, setProgress] = useState(0)

  const verify = useState(0)[0]
  const [verifyProgress, setVerifyProgress] = useState(0)

  const [status, setStatus] = useState("idle")

  // =========================
  // SMOOTH 60FPS PROGRESS
  // =========================
  useEffect(() => {

    let raf

    const animate = () => {
      setProgress(prev => {
        const diff = targetProgress.current - prev
        return Math.abs(diff) < 0.1 ? targetProgress.current : prev + diff * 0.12
      })

      raf = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(raf)

  }, [])

  // =========================
  // USB AUTO REFRESH (NO LAG)
  // =========================
  useEffect(() => {

    const load = async () => {
      const data = await window.electronAPI.getUsbDevices()
      setUsb(data)
    }

    load()
    const id = setInterval(load, 2000)

    return () => clearInterval(id)

  }, [])

  // =========================
  // EVENTS
  // =========================
  useEffect(() => {

    const unsub = window.electronAPI.onFlashEvent(e => {

      if (e.type === "progress") {
        targetProgress.current = e.value
      }

      if (e.type === "verify_progress") {
        setVerifyProgress(e.value)
      }

      if (e.type === "log") {
        setLogs(l => [...l, e.msg])
      }

      if (e.type === "result") {
        setStatus(e.success ? "done" : "error")
      }

    })

    return unsub

  }, [])

  // =========================
  // ISO PICK
  // =========================
  const pickIso = async () => {
    const file = await window.electronAPI.selectIso()
    if (file) setIso(file)
  }

  // =========================
  // FLASH
  // =========================
  const startFlash = async () => {

    setStatus("flashing")
    setLogs([])

    await window.electronAPI.flashIso(mode, iso, device)
  }

  return (
    <div style={{ background: "#1e1e1e", height: "100vh", color: "white", padding: 20 }}>

      <h2>Flash Tool Hybrid UI</h2>

      {/* MODE */}
      <div>
        {["dd","smart","ventoy","etcher"].map(m => (
          <button key={m} onClick={() => setMode(m)}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ISO */}
      <div>
        <input value={iso} readOnly />
        <button onClick={pickIso}>Browse ISO</button>
      </div>

      {/* USB */}
      <select onChange={e => setDevice(e.target.value)}>
        <option>USB</option>
        {usb.map(u => (
          <option key={u.path} value={u.path}>
            {u.name}
          </option>
        ))}
      </select>

      {/* FLASH */}
      <button onClick={startFlash}>
        START
      </button>

      {/* PROGRESS */}
      <div style={{ height: 20, background: "#333", marginTop: 20 }}>
        <div style={{
          width: progress + "%",
          height: "100%",
          background: "lime",
          transition: "none"
        }} />
      </div>

      <div>Progress: {progress.toFixed(1)}%</div>
      <div>Verify: {verifyProgress}%</div>

      {/* LOG */}
      <div style={{ marginTop: 20 }}>
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>

    </div>
  )
}
