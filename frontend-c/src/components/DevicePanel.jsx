import { useEffect, useState } from "react"

const ipc = window.electron

export default function DevicePanel({
  device,
  setDevice,
  iso,
  setIso
}) {

  const [usbList, setUsbList] = useState([])

  const loadUSB = async () => {
    const res = await ipc.invoke("get-usb-devices")
    setUsbList(res || [])
  }

  const selectISO = async () => {
    const file = await ipc.invoke("select-iso")
    if (file) setIso(file)
  }

  useEffect(() => {
    loadUSB()
  }, [])

  return (
    <div className="panel">

      <h3>💾 Device Panel</h3>

      {/* ISO SELECT */}
      <button onClick={selectISO}>
        📀 Select ISO
      </button>

      <div style={{ marginTop: 10 }}>
        <b>ISO:</b>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {iso || "Not selected"}
        </div>
      </div>

      <hr />

      {/* USB LIST */}
      <h4>USB Devices</h4>

      {usbList.length === 0 && (
        <div>No USB found</div>
      )}

      {usbList.map((d, i) => (
        <div
          key={i}
          onClick={() => setDevice(d.path)}
          style={{
            padding: 8,
            margin: 5,
            cursor: "pointer",
            background:
              device === d.path
                ? "#00c3ff"
                : "#222"
          }}
        >
          <div>{d.name}</div>
          <small>{d.path}</small>
        </div>
      ))}

      <hr />

      <div>
        <b>Selected Device:</b>
        <div style={{ fontSize: 12 }}>
          {device || "None"}
        </div>
      </div>

    </div>
  )
}
