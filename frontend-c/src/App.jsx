import { useEffect, useState } from "react"
import DevicePanel from "./components/DevicePanel"
import ModeSelector from "./components/ModeSelector"
import FlashPanel from "./components/FlashPanel"
import LogBox from "./components/LogBox"
import SpeedGraph from "./components/SpeedGraph"
import ProgressRing from "./components/ProgressRing"

const ipc = window.electron

export default function App() {

  const [mode, setMode] = useState("v7")
  const [iso, setIso] = useState("")
  const [device, setDevice] = useState("")

  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)

  useEffect(() => {

    ipc.on("progress", (_, d) => setProgress(d.value))
    ipc.on("speed", (_, d) => setSpeed(d.value))
    ipc.on("log", (_, d) => setLogs(p => [...p, d.msg]))
    ipc.on("result", (_, d) => setResult(d.success))

  }, [])

  const start = async () => {
    setLogs([])
    setProgress(0)
    setResult(null)

    await ipc.invoke("flash", mode, iso, device)
  }

  return (
    <div className="app">

      <h1>🔥 FLASH TOOL PRO DASHBOARD</h1>

      <ModeSelector mode={mode} setMode={setMode} />

      <DevicePanel
        device={device}
        setDevice={setDevice}
        iso={iso}
        setIso={setIso}
      />

      <ProgressRing progress={progress} />

      <SpeedGraph speed={speed} />

      <FlashPanel
        progress={progress}
        speed={speed}
        result={result}
        start={start}
      />

      <LogBox logs={logs} />

    </div>
  )
}
