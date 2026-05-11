import { useEffect, useState } from "react";

export default function App() {

  // =========================
  // 📦 STATE
  // =========================
  const [iso, setIso] = useState("");
  const [device, setDevice] = useState("");
  const [devices, setDevices] = useState([]);

  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState(0);
  const [status, setStatus] = useState("");

  const [logs, setLogs] = useState([]);

  const [mode, setMode] = useState("raw");
  const [partition, setPartition] = useState("GPT");
  const [format, setFormat] = useState("FAT32");
  const [verify, setVerify] = useState(true);

  // =========================
  // 💽 LOAD USB
  // =========================
  useEffect(() => {

    const load = async () => {

      try {

        const res = await fetch(
          "http://127.0.0.1:8000/devices"
        );

        const json = await res.json();

        setDevices(json);

      } catch (e) {
        console.error(e);
      }
    };

    load();

    const interval = setInterval(load, 3000);

    return () => clearInterval(interval);

  }, []);

  // =========================
  // 📁 PICK ISO
  // =========================
  const pickISO = async () => {

    const input = document.createElement("input");

    input.type = "file";
    input.accept = ".iso,.img,.dmg";

    input.onchange = (e) => {

      const file = e.target.files[0];

      if (file) {
        setIso(file.path || file.name);
      }
    };

    input.click();
  };

  // =========================
  // 📝 LOG
  // =========================
  const addLog = (msg) => {

    setLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev
    ]);
  };

  // =========================
  // 🚀 FLASH
  // =========================
  const startFlash = async () => {

    if (!iso) {
      alert("Select ISO");
      return;
    }

    if (!device) {
      alert("Select USB");
      return;
    }

    if (!confirm(
      `FLASH USB?\n\n${device}\n\nALL DATA WILL BE LOST`
    )) {
      return;
    }

    setProgress(0);
    setStatus("Starting...");

    addLog("Starting flash");

    const res = await fetch(
      "http://127.0.0.1:8000/flash",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          iso,
          device,
          mode,
          partition,
          format,
          verify
        })
      }
    );

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {

      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true
      });

      const lines = buffer.split("\n");

      buffer = lines.pop();

      for (let line of lines) {

        if (!line.trim()) continue;

        try {

          const json = JSON.parse(line);

          // =========================
          // 📊 PROGRESS
          // =========================
          if (json.type === "progress") {

            const d = json.data;

            setProgress(d.progress || 0);
            setSpeed(d.speed || 0);
            setEta(d.eta || 0);

            setStatus(
              `${d.progress}%`
            );
          }

          // =========================
          // 🔍 BOOT MODE
          // =========================
          if (json.type === "boot") {

            addLog(
              `Boot mode: ${json.mode}`
            );
          }

          // =========================
          // ❌ ERROR
          // =========================
          if (json.type === "error") {

            addLog(
              `ERROR: ${json.message}`
            );

            alert(json.message);
          }

        } catch (e) {
          console.log(e);
        }
      }
    }

    setStatus("Done");

    addLog("Flash completed");
  };

  // =========================
  // 🎨 UI
  // =========================
  return (
    <div
      style={{
        background: "#0f172a",
        color: "white",
        minHeight: "100vh",
        fontFamily: "sans-serif",
        padding: 30
      }}
    >

      {/* HEADER */}
      <div
        style={{
          marginBottom: 30
        }}
      >
        <h1
          style={{
            fontSize: 40,
            margin: 0
          }}
        >
          🔥 Flash Boot Tool
        </h1>

        <p
          style={{
            color: "#94a3b8"
          }}
        >
          Rufus + balenaEtcher Style
        </p>
      </div>

      {/* CARD */}
      <div
        style={{
          background: "#111827",
          borderRadius: 20,
          padding: 25,
          maxWidth: 900,
          margin: "auto",
          boxShadow: "0 0 30px rgba(0,0,0,0.4)"
        }}
      >

        {/* ISO */}
        <h3>📀 Boot Image</h3>

        <button
          onClick={pickISO}
          style={btn}
        >
          Select ISO
        </button>

        <p>{iso || "No ISO selected"}</p>

        {/* USB */}
        <h3>💽 USB Device</h3>

        <select
          value={device}
          onChange={e =>
            setDevice(e.target.value)
          }
          style={select}
        >
          <option value="">
            Select USB
          </option>

          {devices.map((d, i) => (
            <option
              key={i}
              value={d.path}
            >
              {d.model} | {d.size}
            </option>
          ))}
        </select>

        {/* MODE */}
        <h3>⚙️ Flash Mode</h3>

        <select
          value={mode}
          onChange={e =>
            setMode(e.target.value)
          }
          style={select}
        >
          <option value="raw">
            DD Raw Write
          </option>

          <option value="smart">
            Smart Flash
          </option>

          <option value="ventoy">
            Multi ISO
          </option>
        </select>

        {/* ADVANCED */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 20
          }}
        >

          <div>
            <p>Partition</p>

            <select
              value={partition}
              onChange={e =>
                setPartition(e.target.value)
              }
              style={select}
            >
              <option>GPT</option>
              <option>MBR</option>
            </select>
          </div>

          <div>
            <p>Format</p>

            <select
              value={format}
              onChange={e =>
                setFormat(e.target.value)
              }
              style={select}
            >
              <option>FAT32</option>
              <option>NTFS</option>
              <option>exFAT</option>
            </select>
          </div>

        </div>

        {/* VERIFY */}
        <div
          style={{
            marginTop: 20
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={verify}
              onChange={e =>
                setVerify(e.target.checked)
              }
            />

            Verify after flash
          </label>
        </div>

        {/* FLASH BUTTON */}
        <button
          onClick={startFlash}
          style={{
            ...btn,
            marginTop: 30,
            width: "100%",
            background: "#2563eb"
          }}
        >
          ⚡ FLASH USB
        </button>

        {/* PROGRESS */}
        <div
          style={{
            marginTop: 30
          }}
        >

          <div
            style={{
              height: 25,
              background: "#1e293b",
              borderRadius: 999,
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#22c55e",
                transition: "width 0.2s"
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10
            }}
          >
            <span>{progress}%</span>
            <span>{speed} MB/s</span>
            <span>ETA {eta}s</span>
          </div>

        </div>

        {/* LOGS */}
        <div
          style={{
            marginTop: 30
          }}
        >
          <h3>📜 Logs</h3>

          <div
            style={{
              background: "#020617",
              borderRadius: 10,
              padding: 15,
              height: 200,
              overflow: "auto",
              fontSize: 13
            }}
          >
            {logs.map((l, i) => (
              <div key={i}>
                {l}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

// =========================
// 🎨 STYLE
// =========================
const btn = {
  background: "#1d4ed8",
  border: "none",
  color: "white",
  padding: "12px 20px",
  borderRadius: 12,
  cursor: "pointer",
  fontSize: 16
};

const select = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  background: "#1e293b",
  color: "white",
  border: "1px solid #334155"
};
