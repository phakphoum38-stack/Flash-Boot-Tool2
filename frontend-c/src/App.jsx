import DevicePanel from "./components/DevicePanel"
import FlashPanel from "./components/FlashPanel"
import LogBox from "./components/LogBox"
import ModeSelector from "./components/ModeSelector"
import ProgressRing from "./components/ProgressRing"
import SpeedGraph from "./components/SpeedGraph"

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Flash Tool Pro UI</h2>

      <ModeSelector />
      <DevicePanel />
      <FlashPanel />

      <ProgressRing />
      <SpeedGraph />
      <LogBox />
    </div>
  )
}
