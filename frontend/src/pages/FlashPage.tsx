import { useState, useEffect } from 'react'

type Mode = 'etcher' | 'smart' | 'ventoy'
type UsbDevice = { path: string; name: string; size: number }

export default function FlashPage() {
  const [isoPath, setIsoPath] = useState('')
  const [isoSize, setIsoSize] = useState(0)
  const [devices, setDevices] = useState<UsbDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const [mode, setMode] = useState<Mode>('etcher')
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [isFlashing, setIsFlashing] = useState(false)

  useEffect(() => {
    loadDevices()
    const unsub = window.electron.onFlashEvent((event) => {
      if (event.type === 'progress') setProgress(event.value)
      if (event.type === 'log') setLogs(prev => [...prev, event.msg])
      if (event.type === 'result') setIsFlashing(false)
      if (event.type === 'error') {
        alert(event.msg)
        setIsFlashing(false)
      }
    })
    return unsub
  }, [])

  const loadDevices = async () => {
    const devs = await window.electron.getUsbDevices()
    setDevices(devs)
  }

  const selectIso = async () => {
    const path = await window.electron.selectIsoFile()
    if (path) {
      setIsoPath(path)
      const size = await window.electron.getFileSize(path)
      setIsoSize(size)
    }
  }

  const handleFlash = async () => {
    if (!isoPath ||!selectedDevice) return
    setIsFlashing(true)
    setProgress(0)
    setLogs([])
    await window.electron.flashIso(mode, isoPath, selectedDevice)
  }

  const formatBytes = (bytes: number) => {
    const gb = bytes / 1024 / 1024 / 1024
    return `${gb.toFixed(1)} GB`
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🔥 Flash Boot Tool</h1>

      {/* Select ISO */}
      <div className="mb-4">
        <label className="block mb-2">Select ISO</label>
        <div className="flex gap-2">
          <input
            value={isoPath}
            readOnly
            className="flex-1 bg-gray-800 p-2 rounded"
            placeholder="No file selected"
          />
          <button
            onClick={selectIso}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Browse
          </button>
        </div>
        {isoSize > 0 && (
          <p className="text-sm text-gray-400 mt-1">Size: {formatBytes(isoSize)}</p>
        )}
      </div>

      {/* Select USB */}
      <div className="mb-4">
        <label className="block mb-2">Select USB</label>
        <select
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          className="w-full bg-gray-800 p-2 rounded"
        >
          <option value="">-- Select Device --</option>
          {devices.map(d => (
            <option key={d.path} value={d.path}>
              {d.name} - {formatBytes(d.size)}
            </option>
          ))}
        </select>
      </div>

      {/* Mode Selection */}
      <div className="mb-6">
        <label className="block mb-2">Mode</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === 'etcher'}
              onChange={() => setMode('etcher')}
            />
            <span>Etcher Mode - Raw write, fastest, simple</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === 'smart'}
              onChange={() => setMode('smart')}
            />
            <span>Rufus Smart Mode - GPT/FAT32, UEFI + Legacy</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === 'ventoy'}
              onChange={() => setMode('ventoy')}
            />
            <span>Ventoy Multi-ISO - Boot multiple ISOs</span>
          </label>
        </div>
      </div>

      {/* Flash Button */}
      <button
        onClick={handleFlash}
        disabled={!isoPath ||!selectedDevice || isFlashing}
        className="w-full py-3 bg-green-600 rounded font-bold disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {isFlashing? 'Flashing...' : 'Flash'}
      </button>

      {/* Progress */}
      {isFlashing && (
        <div className="mt-4">
          <div className="w-full bg-gray-800 rounded h-4 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center mt-2">{progress}%</p>
        </div>
      )}

      {/* Log */}
      <div className="mt-4 bg-black p-3 rounded h-48 overflow-y-auto font-mono text-sm">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  )
}
