import { useEffect, useRef, useState } from "react"

export default function App() {
  const [mode, setMode] = useState("dd")
  const [iso, setIso] = useState("")
  const [device, setDevice] = useState("")
  const [usb, setUsb] = useState([])

  // raw backend value
  const rawProgress = useRef(0)
  const rawVerify = useRef(0)

  // smooth UI value
  const [progress, setProgress] = useState(0)
  const [verify, setVerify] = useState(0)

  const [status, setStatus] = useState("idle")
  const [logs, setLogs] = useState([])

  // =========================
  // 60fps animation engine
  // =========================
  useEffect(() => {
    let frame

    const animate = () => {
      setProgress(p => p + (rawProgress.current - p) * 0.15)
      setVerify(p => p + (rawVerify.current - p) * 0.15)

      frame = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(frame)
  }, [])

  // =========================
  // USB refresh (no spam)
  // =========================
  useEffect(() => {
    const load = async () => {
      const d = await window.electron.getUsbDevices()
      setUsb(d)
    }

    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])

  // =========================
  // FLASH EVENTS
  // =========================
  useEffect(() => {
    const off = window.electron.onFlashEvent(ev => {
      switch (ev.type) {
        case "progress":
          rawProgress.current = ev.value
          break

        case "verify":
          rawVerify.current = ev.value
          break

        case "log":
          setLogs(l => [...l, ev.msg])
          break

        case "result":
          setStatus(ev.success ? "done" : "error")
          break

        case "cancelled":
          setStatus("idle")
          rawProgress.current = 0
          rawVerify.current = 0
          break
      }
    })

    return off
  }, [])

  // =========================
  // ACTIONS
  // =========================
  const start = async () => {
    if (!iso || !device) return alert("missing")

    setStatus("flashing")
    setLogs([])

    await window.electron.flashIso(mode, iso, device)
  }

  return (
    <div style={{ padding: 20, fontFamily: "Tahoma" }}>
      <h2>Flash Tool vNext</h2>

      {/* MODE */}
      <div>
        {["dd", "smart", "ventoy", "etcher"].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              marginRight: 10,
              background: mode === m ? "blue" : "#ccc",
              color: mode === m ? "#fff" : "#000"
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* ISO */}
      <div>
        <input value={iso} readOnly />
        <button onClick={async () => {
          const p = await window.electron.selectIso()
          if (p) setIso(p)
        }}>
          Select ISO
        </button>
      </div>

      {/* USB */}
      <select value={device} onChange={e => setDevice(e.target.value)}>
        <option value="">USB</option>
        {usb.map(u => (
          <option key={u.path} value={u.path}>
            {u.name}
          </option>
        ))}
      </select>

      {/* START */}
      <button onClick={start}>START</button>

      {/* PROGRESS */}
      <div style={{ marginTop: 20 }}>
        <div>Progress: {progress.toFixed(1)}%</div>
        <div>Verify: {verify.toFixed(1)}%</div>

        <div style={{
          height: 20,
          background: "#222"
        }}>
          <div style={{
            width: `${progress}%`,
            height: "100%",
            background: "lime"
          }} />
        </div>
      </div>

      {/* LOGS */}
      <pre style={{ background: "#000", color: "#0f0", height: 200 }}>
        {logs.join("\n")}
      </pre>
    </div>
  )
}
