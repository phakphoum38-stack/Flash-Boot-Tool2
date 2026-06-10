import { useEffect, useState } from "react";

export default function DevicePanel({
  device,
  setDevice,
  iso,
  setIso
}) {
  const [usbList, setUsbList] = useState([]);
  const [loading, setLoading] = useState(false);

  const ipc = window.electron;

  const loadUSB = async () => {
    try {
      setLoading(true);

      if (!ipc?.getUsbDevices) {
        console.warn("Electron API not available");
        setUsbList([]);
        return;
      }

      const devices = await ipc.getUsbDevices();

      if (Array.isArray(devices)) {
        setUsbList(devices);
      } else {
        setUsbList([]);
      }
    } catch (err) {
      console.error("USB load failed:", err);
      setUsbList([]);
    } finally {
      setLoading(false);
    }
  };

  const selectISO = async () => {
    try {
      if (!ipc?.selectIso) {
        console.warn("Electron API not available");
        return;
      }

      const file = await ipc.selectIso();

      if (file) {
        setIso(file);
      }
    } catch (err) {
      console.error("Select ISO failed:", err);
    }
  };

  useEffect(() => {
    loadUSB();
  }, []);

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

      {loading && (
        <div>Loading USB devices...</div>
      )}

      {!loading && usbList.length === 0 && (
        <div>No USB devices found</div>
      )}

      {usbList.map((d, i) => (
        <div
          key={i}
          onClick={() => setDevice(d.path)}
          style={{
            padding: 10,
            marginTop: 5,
            borderRadius: 6,
            cursor: "pointer",
            border: "1px solid #444",
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
            {d.path || "Unknown Path"}
          </small>
        </div>
      ))}

      <hr />

      <div>
        <b>Selected Device:</b>

        <div
          style={{
            fontSize: 12,
            wordBreak: "break-all"
          }}
        >
          {device || "None"}
        </div>
      </div>

      <button
        style={{ marginTop: 10 }}
        onClick={loadUSB}
      >
        🔄 Refresh USB
      </button>
    </div>
  );
}
