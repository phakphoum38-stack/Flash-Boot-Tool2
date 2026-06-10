import { useState } from "react";

import DevicePanel from "./components/DevicePanel";
import FlashPanel from "./components/FlashPanel";
import LogBox from "./components/LogBox";
import ModeSelector from "./components/ModeSelector";
import ProgressRing from "./components/ProgressRing";
import SpeedGraph from "./components/SpeedGraph";

export default function App() {

  const [mode, setMode] = useState("dd");

  const [device, setDevice] = useState("");
  const [iso, setIso] = useState("");

  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);

  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);

  const startFlash = async () => {

    try {

      if (!window.electron) {
        alert("Electron API not available");
        return;
      }

      setLogs(prev => [
        ...prev,
        "Starting flash..."
      ]);

      const res =
        await window.electron.flashIso(
          mode,
          iso,
          device
        );

      setResult(res);

    } catch (err) {

      console.error(err);

      setLogs(prev => [
        ...prev,
        String(err)
      ]);

      setResult(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>

      <h2>Flash Tool Pro UI</h2>

      <ModeSelector
        mode={mode}
        setMode={setMode}
      />

      <DevicePanel
        device={device}
        setDevice={setDevice}
        iso={iso}
        setIso={setIso}
      />

      <FlashPanel
        progress={progress}
        speed={speed}
        result={result}
        start={startFlash}
      />

      <ProgressRing
        progress={progress}
      />

      <SpeedGraph
        speed={speed}
      />

      <LogBox
        logs={logs}
      />

    </div>
  );
}
