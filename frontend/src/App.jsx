
import { useEffect, useRef, useState } from “react”

export default function App() {

const [mode, setMode] = useState(“dd”)
const [iso, setIso] = useState(””)
const [device, setDevice] = useState(””)
const [usb, setUsb] = useState([])

const rawProgress = useRef(0)
const rawVerify = useRef(0)

const [progress, setProgress] = useState(0)
const [verify, setVerify] = useState(0)

const [speed, setSpeed] = useState(0)

const [status, setStatus] =
useState(“idle”)

const [logs, setLogs] =
useState([])

const logRef = useRef(null)

// =========================
// Smooth Animation 60fps
// =========================
useEffect(() => {

let frame
const animate = () => {
  setProgress(p =>
    p +
    (
      rawProgress.current -
      p
    ) * 0.15
  )
  setVerify(v =>
    v +
    (
      rawVerify.current -
      v
    ) * 0.15
  )
  frame =
    requestAnimationFrame(
      animate
    )
}
animate()
return () =>
  cancelAnimationFrame(
    frame
  )

}, [])

// =========================
// Auto Scroll Logs
// =========================
useEffect(() => {

if (logRef.current) {
  logRef.current.scrollTop =
    logRef.current.scrollHeight
}

}, [logs])

// =========================
// USB Refresh
// =========================
useEffect(() => {

const load = async () => {
  try {
    const list =
      await window.electron.getUsbDevices()
    setUsb(list)
  } catch (err) {
    console.error(err)
  }
}
load()
const timer =
  setInterval(load, 3000)
return () =>
  clearInterval(timer)

}, [])

// =========================
// Flash Events
// =========================
useEffect(() => {

const off =
  window.electron.onFlashEvent(
    ev => {

      console.log(
        "FLASH EVENT:",
        ev
      )

      switch (ev.type) {

        case "progress":

          rawProgress.current =
            ev.value

          break

        case "verify":

          rawVerify.current =
            ev.value

          break

        case "speed":

          setSpeed(
            ev.value
          )

          break

        case "log":

          setLogs(prev => [
            ...prev,
            ev.msg
          ])

          break

        case "error":

          console.error(
            "FLASH ERROR EVENT:",
            ev
          )

          setStatus(
            "error"
          )

          setLogs(prev => [
            ...prev,
            "ERROR: " +
            ev.msg
          ])

          break

        case "result":

          console.log(
            "FLASH RESULT EVENT:",
            ev
          )

          setStatus(
            ev.success
              ? "done"
              : "error"
          )

          break

        case "cancelled":

          console.log(
            "FLASH CANCELLED"
          )

          setStatus(
            "idle"
          )

          rawProgress.current = 0
          rawVerify.current = 0

          setSpeed(0)

          break

        default:

          console.log(
            "UNKNOWN EVENT:",
            ev
          )

          break
      }
    }
  )
return off

}, [])

// =========================
// Select ISO
// =========================
const selectIso =
async () => {

  const file =
    await window.electron.selectIso()
  if (file) {
    setIso(file)
    setLogs(prev => [
      ...prev,
      `ISO: ${file}`
    ])
  }
}

// =========================
// Start Flash
// =========================
const start = async () => {

  console.log("START CLICK")

  console.log({
    mode,
    iso,
    device
  })

  if (!iso) {
    alert("Select ISO")
    return
  }

  if (!device) {
    alert("Select USB")
    return
  }

  rawProgress.current = 0
  rawVerify.current = 0

  setProgress(0)
  setVerify(0)

  setSpeed(0)

  setLogs([])

  setStatus("flashing")

  setLogs(prev => [
    ...prev,
    `Mode: ${mode}`,
    `ISO: ${iso}`,
    `USB: ${device}`
  ])

  try {

    const result =
      await window.electron.flashIso(
        mode,
        iso,
        device
      )

    console.log(
      "FLASH RESULT:",
      result
    )

    setLogs(prev => [
      ...prev,
      `Flash started`
    ])

  } catch (err) {

    console.error(
      "FLASH ERROR:",
      err
    )

    setStatus("error")

    setLogs(prev => [
      ...prev,
      `ERROR: ${err.message}`
    ])

    alert(
      "Flash Start Failed"
    )
  }
}

// =========================
// Cancel
// =========================
const cancel =
() => {

  window.electron.cancelFlash()
}

const isFlashing =
status === “flashing”

return (

<div
  style={{
    padding: 20,
    background: "#2f4f6f",
    minHeight: "100vh",
    fontFamily: "Tahoma"
  }}
>
  <h1
    style={{
      color: "#fff"
    }}
  >
    Flash Tool FINAL BOSS
  </h1>
  {/* MODE */}
  <div
    style={{
      marginBottom: 15
    }}
  >
    {
      [
        "dd",
        "smart",
        "ventoy",
        "etcher"
      ].map(m => (
        <button
          key={m}
          onClick={() =>
            setMode(m)
          }
          style={{
            marginRight: 10,
            padding: 10,
            background:
              mode === m
                ? "#0b57d0"
                : "#ccc",
            color:
              mode === m
                ? "#fff"
                : "#000"
          }}
        >
          {m.toUpperCase()}
        </button>
      ))
    }
  </div>
  {/* ISO */}
  <div>
    <input
      value={iso}
      readOnly
      style={{
        width: 600,
        height: 35
      }}
    />
    <button
      onClick={selectIso}
    >
      Select ISO
    </button>
  </div>
  {/* USB */}
  <div
    style={{
      marginTop: 10
    }}
  >
    <select
      value={device}
      onChange={e =>
        setDevice(
          e.target.value
        )
      }
    >
      <option value="">
        Select USB
      </option>
      {
        usb.map(u => (
          <option
            key={u.path}
            value={u.path}
          >
            {u.name}
            {" "}
            (
            {
              (
                u.size /
                1024 /
                1024 /
                1024
              ).toFixed(1)
            }
            GB)
          </option>
        ))
      }
    </select>
  </div>
  {/* ACTIONS */}
  <div
    style={{
      marginTop: 15
    }}
  >
    <button
      onClick={start}
      disabled={isFlashing}
    >
      START FLASH
    </button>
    <button
      onClick={cancel}
      disabled={!isFlashing}
      style={{
        marginLeft: 10
      }}
    >
      CANCEL
    </button>
  </div>
  {/* STATUS */}
  <div
    style={{
      marginTop: 15,
      color: "#fff"
    }}
  >
    Status: {status}
  </div>
  {/* SPEED */}
  <div
    style={{
      color: "#fff"
    }}
  >
    Speed:
    {" "}
    {speed}
    {" "}
    MB/s
  </div>
  {/* PROGRESS */}
  <div
    style={{
      marginTop: 20
    }}
  >
    <div
      style={{
        color: "#fff"
      }}
    >
      Progress:
      {" "}
      {progress.toFixed(1)}
      %
    </div>
    <div
      style={{
        height: 20,
        background: "#222"
      }}
    >
      <div
        style={{
          width:
            `${progress}%`,
          height: "100%",
          background:
            "#00ff66"
        }}
      />
    </div>
  </div>
  {/* VERIFY */}
  <div
    style={{
      marginTop: 10
    }}
  >
    <div
      style={{
        color: "#fff"
      }}
    >
      Verify:
      {" "}
      {verify.toFixed(1)}
      %
    </div>
    <div
      style={{
        height: 20,
        background: "#222"
      }}
    >
      <div
        style={{
          width:
            `${verify}%`,
          height: "100%",
          background:
            "#00aaff"
        }}
      />
    </div>
  </div>
  {/* LOGS */}
  <pre
    ref={logRef}
    style={{
      marginTop: 20,
      background: "#000",
      color: "#0f0",
      height: 300,
      overflow: "auto",
      padding: 10
    }}
  >
    {logs.join("\n")}
  </pre>
