import { useEffect, useState } from "react"

const electron = window.electron

export default function DevicePanel({
  device,
  setDevice,
  iso,
  setIso
}) {

  const [usbList, setUsbList] = useState([])

  const loadUSB = async () => {
    try {

      if (!electron?.getUsbDevices) {
        console.log("getUsbDevices API missing")
        setUsbList([])
        return
      }

      const res = await electron.getUsbDevices()

      setUsbList(
        Array.isArray(res)
          ? res
          : []
      )

    } catch (err) {

      console.error(
        "USB load error:",
        err
      )

      setUsbList([])
    }
  }

  const selectISO = async () => {
    try {

      if (!electron?.selectIso) {
        console.log("selectIso API missing")
        return
      }

      const file =
        await electron.selectIso()

      console.log(
        "ISO selected:",
        file
      )

      if (file) {
        setIso(file)
      }

    } catch (err) {

      console.error(
        "ISO select error:",
        err
      )
    }
  }

  useEffect(() => {
    loadUSB()
  }, [])

  return (
    <div className="panel">

      <h3>💾 Device Panel</h3>

      <button onClick={selectISO}>
        📀 Select ISO
      </button>

      <div style={{ marginTop: 10 }}>
        <b>ISO:</b>

        <div
          style={{
            fontSize: 12,
            opacity: 0.7,
            wordBreak: "break-all"
          }}
        >
          {iso || "Not selected"}
        </div>
      </div>

      <hr />

      <h4>USB Devices</h4>

      {usbList.length === 0 && (
        <div>No USB found</div>
      )}

      {usbList.map((d, i) => (
        <div
          key={i}
          onClick={() =>
            setDevice(d.path)
          }
          style={{
            padding: 8,
            margin: 5,
            cursor: "pointer",
            borderRadius: 6,
            background:
              device === d.path
                ? "#00c3ff"
                : "#222"
          }}
        >
          <div>
            {d.name || "Unknown Device"}
          </div>

          <small>
            {d.path || ""}
          </small>
        </div>
      ))}

      <hr />

      <div>
        <b>Selected Device:</b>

        <div
          style={{
            fontSize: 12
          }}
        >
          {device || "None"}
        </div>
      </div>

    </div>
  )
}
