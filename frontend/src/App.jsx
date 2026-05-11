import { useEffect, useState } from "react";

export default function App() {

  // =========================
  // p  // =========================
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
  // p  // =========================
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
  // p  // =========================
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
  // p  // =========================
  const addLog = (msg) => {

    setLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev
    ]);
  };

  // =========================
  // p  // =========================
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
          // p          // =========================
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
          // p BOOT MODE
          // =========================
          if (json.type === "boot") {

            addLog(
              `Boot mode: ${json.mode}`
            );
          }

          // =========================
          // body ERROR
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
  // p  // =========================
  return 
