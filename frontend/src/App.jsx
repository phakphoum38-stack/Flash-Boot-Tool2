import { useState, useEffect } from 'react';

function App() {
  const [isoPath, setIsoPath] = useState('');
  const [device, setDevice] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    window.electron.onFlashProgress(setProgress);
    window.electron.onFlashError((err) => {
      setStatus('error');
      alert('Error: ' + err);
    });

    return () => {
      window.electron.removeAllListeners('flash-progress');
      window.electron.removeAllListeners('flash-error');
    };
  }, []);

  const handleFlash = async () => {
    if (!isoPath ||!device) return alert('เลือกไฟล์ ISO และ Device ก่อน');
    setStatus('flashing');
    setProgress(0);

    const res = await window.electron.flashIso(isoPath, device);
    setStatus(res.success? 'done' : 'error');
    if (res.success) alert('Flash เสร็จแล้ว!');
  };

  const selectIso = async () => {
    const file = await window.showOpenFilePicker({
      types: [{ description: 'ISO Files', accept: { 'application/x-iso9660-image': ['.iso'] } }]
    });
    setIsoPath(file[0].name); // ใน Electron จริงๆต้องใช้ dialog.showOpenDialog
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Flash Boot Tool</h2>

      <div>
        <label>ISO File:</label>
        <input type="text" value={isoPath} readOnly />
        <button onClick={selectSelectIso}>Browse</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <label>USB Device:</label>
        <input
          type="text"
          placeholder="PhysicalDrive1"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
        />
      </div>

      <button
        onClick={handleFlash}
        disabled={status === 'flashing'}
        style={{ marginTop: 20 }}
      >
        {status === 'flashing'? 'Flashing...' : 'Start Flash'}
      </button>

      {status === 'flashing' && (
        <div style={{ marginTop: 20 }}>
          <div style={{ border: '1px solid #ccc', height: 20 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'green' }} />
          </div>
          <p>{progress}%</p>
        </div>
      )}

      {status === 'done' && <p style={{ color: 'green' }}>สำเร็จ!</p>}
    </div>
  );
}

export default App;
