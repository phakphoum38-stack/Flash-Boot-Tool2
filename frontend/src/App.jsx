import { useEffect, useRef, useState } from "react"

export default function App() {

  const [mode, setMode] = useState("dd")
  const [isoPath, setIsoPath] = useState("")
  const [device, setDevice] = useState("")
  const [usbDevices, setUsbDevices] = useState([])

  const [progress, setProgress] = useState(0)
  const targetProgress = useRef(0)

  const [verify, setVerify] = useState(0)
  const [status, setStatus] = useState("idle")
  const [logs, setLogs] = useState([])

  // =========================
  // 60 FPS SMOOTH PROGRESS
  // =========================
  useEffect(() => {

    let frame

    const animate = () => {
      setProgress(prev => {
        const diff = targetProgress.current - prev
        return prev + diff * 0.12
      })

      frame = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(frame)
  }, [])

  // =========================
  // USB SMART REFRESH (NO LAG)
  // =========================
  const lastUSB = useRef("")

  const loadUSB = async () => {
    const list = await window.electronAPI.getUsbDevices()

    const hash = JSON.stringify(list.map(x => x.path))

    if (hash !== lastUSB.current) {
      lastUSB.current = hash
      setUsbDevices(list)
    }
  }

  useEffect(() => {
    loadUSB()
    const t = setInterval(loadUSB, 8000)
    return () => clearInterval(t)
  }, [])

  // =========================
  // EVENTS
  // =========================
  useEffect(() => {

    const unsub = window.electronAPI.onFlashEvent((e) => {

      if (e.type === "progress") {
        targetProgress.current = e.value
      }

      if (e.type === "verify_progress") {
        setVerify(e.value)
      }

      if (e.type === "log") {
        setLogs(p => [...p, e.msg])
      }

      if (e.type === "result") {
        setStatus(e.success ? "done" : "error")
      }

      if (e.type === "cancelled") setStatus("idle")
    })

    return () => unsub()
  }, [])

  // =========================
  // ISO SELECT FIX
  // =========================
  const selectIso = async () => {
    const file = await window.electronAPI.selectIso()
    if (file) setIsoPath(file)
  }

  const flash = async () => {
    if (!isoPath || !device) return alert("missing")

    setStatus("flashing")
    setProgress(0)

    await window.electronAPI.flashIso(mode, isoPath, device)
  }

  return (
    <div style={{ padding: 20 }}>

      <h2>🔥 Flash Tool Pro</h2>

      <input value={isoPath} readOnly />
      <button onClick={selectIso}>Browse ISO</button>

      <select onChange={e => setDevice(e.target.value)}>
        <option value="">USB</option>
        {usbDevices.map(u => (
          <option key={u.path} value={u.path}>
            {u.name}
          </option>
        ))}
      </select>

      <div style={{
        height: 20,
        width: 300,
        border: "1px solid #000"
      }}>
        <div style={{
          width: `${progress}%`,
          height: "100%",
          background: "lime"
        }} />
      </div>

      <button onClick={flash}>START</button>

      <div>
        VERIFY: {verify}%
      </div>

      <div>
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>

    </div>
  )
}
