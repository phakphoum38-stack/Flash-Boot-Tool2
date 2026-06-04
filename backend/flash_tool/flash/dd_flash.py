import win32file
import threading
import time
from pathlib import Path

# Global events สำหรับ control จากภายนอก
_cancel_event = threading.Event()
_pause_event = threading.Event()
_pause_event.set()

def dd_flash(iso_path: Path, device_path: str, emit):
    _cancel_event.clear()
    _pause_event.set()
    
    emit("log", level="info", msg=f"Starting Etcher mode: {iso_path.name}")
    
    CHUNK = 4 * 1024 * 1024
    size = iso_path.stat().st_size
    written = 0
    start_time = time.time()
    last_written = 0
    
    try:
        handle = win32file.CreateFileW(
            device_path,
            win32file.GENERIC_WRITE,
            0, None,
            win32file.OPEN_EXISTING,
            win32file.FILE_FLAG_NO_BUFFERING | win32file.FILE_FLAG_WRITE_THROUGH,
            None
        )
        
        with open(iso_path, 'rb') as f:
            while True:
                if _cancel_event.is_set():
                    emit("log", level="warn", msg="Flash cancelled by user")
                    return
                
                _pause_event.wait()
                
                chunk = f.read(CHUNK)
                if not chunk:
                    break
                
                win32file.WriteFile(handle, chunk)
                written += len(chunk)
                
                # คำนวณ speed แบบไม่ใช้ global
                last_speed_time = time.time()

...

if time.time() - last_speed_time > 0.5:

```
speed = int(
    (written - last_written)
    /
    (time.time() - last_speed_time)
    /
    1024
    /
    1024
)

last_written = written
last_speed_time = time.time()
```

else:

```
speed = 0
```

                
                progress = int(written * 100 / size)
                emit("progress", value=progress, written=written, total=size, speed=speed)
        
        win32file.CloseHandle(handle)
        emit("log", level="info", msg="Write completed")
        
    except Exception as e:
        emit("error", msg=str(e))

def cancel_flash():
    _cancel_event.set()
    _pause_event.set()

def pause_flash():
    _pause_event.clear()

def resume_flash():
    _pause_event.set()
