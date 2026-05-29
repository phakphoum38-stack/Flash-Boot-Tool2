import { useState, useEffect } from 'react'

function App() {

  const [mode, setMode] = useState('dd')
  const [isoPath, setIsoPath] = useState('')
  const [device, setDevice] = useState('')
  const [usbDevices, setUsbDevices] = useState([])

  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')

  const [logs, setLogs] = useState([])

  const [isPaused, setIsPaused] = useState(false)

  // =========================
  // LOAD USB
  // =========================
  useEffect(() => {

    loadUsbDevices()

    const interval = setInterval(() => {
      loadUsbDevices()
    }, 3000)

    const unsubscribe =
     window.electronAPI.onFlashEvent((event) => {

        console.log(event)

        // progress
        if (event.type === 'progress') {
          setProgress(event.value)
        }

        // logs
        if (event.type === 'log') {
          addLog(event.msg)
        }

        // paused
        if (event.type === 'paused') {
          setIsPaused(true)
          addLog('Flash paused')
        }

        // resumed
        if (event.type === 'resumed') {
          setIsPaused(false)
          addLog('Flash resumed')
        }

        // cancelled
        if (event.type === 'cancelled') {
          setStatus('idle')
          setProgress(0)
          setIsPaused(false)

          addLog('Flash cancelled')
        }

        // error
        if (event.type === 'error') {

          setStatus('error')

          setIsPaused(false)

          addLog('ERROR: ' + event.msg)

          alert('Error: ' + event.msg)
        }

        // done
        if (event.type === 'result') {

          setStatus(
            event.success
              ? 'done'
              : 'error'
          )

          setIsPaused(false)

          if (event.success) {

            addLog('Flash completed successfully')

            alert(
              'Flash เสร็จแล้ว!'
            )

          } else {

            addLog('Flash failed')
          }
        }
      })

    return () => {

      clearInterval(interval)

      unsubscribe()
    }

  }, [])

  // =========================
  // LOAD USB
  // =========================
  const loadUsbDevices = async () => {

    try {

      const devices =
        await window.electron.getUsbDevices()

      setUsbDevices(devices)

    } catch (e) {

      console.error(e)
    }
  }

  // =========================
  // LOGS
  // =========================
  const addLog = (msg) => {

    const time =
      new Date().toLocaleTimeString()

    setLogs(prev => [
      ...prev,
      `[${time}] ${msg}`
    ])
  }

  // =========================
  // SELECT ISO
  // =========================
const handleSelectIso = async () => {

  try {

    const filePath =
      await window.electron.selectIso()

    if (filePath) {

      setIsoPath(filePath)

      addLog(
        'Selected ISO: ' + filePath
      )
    }

  } catch (e) {

    console.error(e)

    alert('Cannot select ISO')
  }
}

  // =========================
  // FLASH
  // =========================
  const handleFlash = async () => {

    if (!isoPath || !device) {

      return alert(
        'เลือกไฟล์ ISO และ USB ก่อน'
      )
    }

    const confirmFlash =
      confirm(
        'ข้อมูลใน USB จะถูกลบทั้งหมด ดำเนินการต่อหรือไม่?'
      )

    if (!confirmFlash) {
      return
    }

    setStatus('flashing')

    setProgress(0)

    setLogs([])

    addLog('Starting flash process...')
    addLog('Mode: ' + mode)
    addLog('ISO: ' + isoPath)
    addLog('USB: ' + device)

    try {

      await window.electron.flashIso(
        mode,
        isoPath,
        device
      )

    } catch (e) {

      console.error(e)
    }
  }

  // =========================
  // CANCEL
  // =========================
  const handleCancel = async () => {

    await window.electron.cancelFlash()

    setStatus('idle')

    setProgress(0)

    setIsPaused(false)
  }

  // =========================
  // PAUSE
  // =========================
  const handlePause = async () => {

    if (isPaused) {

      await window.electron.resumeFlash()

    } else {

      await window.electron.pauseFlash()
    }

    setIsPaused(!isPaused)
  }

  const isFlashing =
    status === 'flashing'

  // =========================
  // TAB STYLE
  // =========================
  const tabStyle = (active) => ({
    padding: '10px 20px',
    marginRight: 10,
    border: '2px solid #555',
    background: active
      ? '#004cff'
      : '#d9d9d9',
    color: active
      ? 'white'
      : 'black',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 16
  })

  // =========================
  // BUTTON STYLE
  // =========================
  const buttonStyle = {
    padding: '12px 20px',
    fontWeight: 'bold',
    fontSize: 16,
    cursor: 'pointer',
    border: '2px solid #444',
    background:
      'linear-gradient(#fff,#d0d0d0)'
  }

  // =========================
  // UI
  // =========================
  return (

    <div style={{
      minHeight: '100vh',
      background: '#2f4f6f',
      padding: 20,
      fontFamily: 'Tahoma'
    }}>

      <div style={{
        width: 1400,
        margin: '0 auto',
        background: '#d6d6d6',
        border: '3px solid #777',
        boxShadow:
          '0 0 20px rgba(0,0,0,.5)'
      }}>

        {/* TITLE BAR */}
        <div style={{
          height: 40,
          background:
            'linear-gradient(#003c8f,#0b57d0)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 15,
          fontWeight: 'bold',
          fontSize: 20
        }}>
          Flash Boot Tool v3.11
        </div>

        {/* CONTENT */}
        <div style={{
          display: 'flex',
          gap: 20,
          padding: 20
        }}>

          {/* LEFT PANEL */}
          <div style={{ width: 340 }}>

            {/* MODE */}
            <div style={{
              marginBottom: 20
            }}>

              <button
                onClick={() => setMode('dd')}
                style={tabStyle(mode === 'dd')}
              >
                DD
              </button>

              <button
                onClick={() => setMode('smart')}
                style={tabStyle(mode === 'smart')}
              >
                SMART
              </button>

              <button
                onClick={() => setMode('ventoy')}
                style={tabStyle(mode === 'ventoy')}
              >
                VENTOY
              </button>

            </div>

            {/* ISO */}
            <div style={{
              border: '2px solid #999',
              padding: 15,
              marginBottom: 20,
              background: '#eee'
            }}>

              <h3>Select ISO File</h3>

              <input
                type="text"
                value={isoPath}
                readOnly
                style={{
                  width: '100%',
                  height: 35,
                  marginBottom: 10
                }}
              />

              <button
                onClick={handleSelectIso}
                disabled={isFlashing}
                style={buttonStyle}
              >
                Browse ISO
              </button>

            </div>

            {/* USB */}
            <div style={{
              border: '2px solid #999',
              padding: 15,
              marginBottom: 20,
              background: '#eee'
            }}>

              <h3>USB Drive</h3>

              <select
                value={device}
                onChange={(e) =>
                  setDevice(e.target.value)
                }
                style={{
                  width: '100%',
                  height: 40
                }}
              >

                <option value="">
                  -- Select USB --
                </option>

                {usbDevices.map((d) => (

                  <option
                    key={d.path}
                    value={d.path}
                  >
                    {d.name}
                    {' '}
                    (
                    {(d.size / 1024 / 1024 / 1024)
                      .toFixed(1)}
                    GB)
                  </option>

                ))}

              </select>

            </div>

            {/* BUTTONS */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>

              <button
                onClick={handleFlash}
                disabled={
                  isFlashing ||
                  !isoPath ||
                  !device
                }
                style={buttonStyle}
              >
                START FLASH
              </button>

              {isFlashing && (

                <>
                  <button
                    onClick={handlePause}
                    style={buttonStyle}
                  >
                    {isPaused
                      ? 'RESUME'
                      : 'PAUSE'}
                  </button>

                  <button
                    onClick={handleCancel}
                    style={{
                      ...buttonStyle,
                      color: 'red'
                    }}
                  >
                    CANCEL
                  </button>
                </>
              )}

            </div>

          </div>

          {/* CENTER */}
          <div style={{ flex: 1 }}>

            <div style={{
              background: 'black',
              color: '#00ff00',
              height: 550,
              overflow: 'auto',
              padding: 20,
              border: '4px solid #555',
              fontFamily: 'Consolas',
              fontSize: 18
            }}>

              <div style={{
                color: '#00ffff',
                marginBottom: 20,
                fontSize: 28
              }}>
                FLASH CONSOLE
              </div>

              {logs.map((log, index) => (

                <div key={index}>
                  {log}
                </div>

              ))}

            </div>

            {/* PROGRESS */}
            <div style={{
              marginTop: 20
            }}>

              <div style={{
                width: '100%',
                height: 40,
                border: '2px solid #333',
                background: '#111'
              }}>

                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background:
                    isPaused
                      ? 'orange'
                      : '#00ff66',
                  transition:
                    'width .3s'
                }} />

              </div>

              <div style={{
                marginTop: 10,
                fontWeight: 'bold'
              }}>
                {progress}%
                {' '}
                {isPaused && '(Paused)'}
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

export default App
```
