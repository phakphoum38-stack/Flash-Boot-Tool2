import win32file
import win32api
import os
import threading

CHUNK = 4 * 1024 * 1024  # 4MB

class FlashWorker:
    def __init__(self, iso_path, device_path, emit):
        self.iso_path = iso_path
        self.device_path = device_path
        self.emit = emit
        self.pause_event = threading.Event()
        self.pause_event.set()  # set = not paused
        self.cancel_event = threading.Event()
        self.thread = None

    def start(self):
        self.thread = threading.Thread(targetได้เลย นี่คือ `dd_flash.py` ที่รองรับ cancel + pause จริงๆ ผ่าน IPC

### `backend/flash_tool/flash/dd_flash.py`

```python
import win32file
import win32api
import threading
import time
from pathlib import Path

# ตัวแปร global ไว้สื่อสารกับ thread หลัก
_cancel_event = threading.Event()
_pause_event = threading.Event()
_pause_event.set()  # set = ไม่ pause

def dd_flash(iso_path: Path, device_path: str, emit):
    """
    เขียน ISO แบบ raw dd
    รองรับ cancel และ pause ผ่าน event
    """
    _cancel_event.clear()
    _pause_event.set()
    
    emit("log", level="info", msg=f"Starting Etcher mode: {iso_path.name}")
    
    CHUNK = 4 * 1024 * 1024  # 4MB
    size = iso_path.stat().st_size
    written = 0
    
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
                # เช็ค cancel
                if _cancel_event.is_set():
                    emit("log", level="warn", msg="Flash cancelled by user")
                    emit("result", success=False, msg="Cancelled")
                    return
                
                # เช็ค pause
                _pause_event.wait()  # จะ block ถ้า pause
                
                chunk = f.read(CHUNK)
                if not chunk:
                    break
                
                win32file.WriteFile(handle, chunk)
                written += len(chunk)
                
                progress = int(written * 100 / size)
                speed = calculate_speed(written)
                emit("progress", value=progress, written=written, total=size, speed=speed)
        
        win32file.CloseHandle(handle)
        emit("log", level="info", msg="Write completed")
        emit("result", success=True, msg="Flash completed")
        
    except Exception as e:
        emit("error", msg=str(e))
        emit("result", success=False, msg=str(e))

def calculate_speed(written_bytes):
    # เก็บ timestamp ครั้งสุดท้ายไว้คำนวณ speed
    if not hasattr(calculate_speed, "last_time"):
        calculate_speed.last_time = time.time()
        calculate_speed.last_written = 0
    
    now = time.time()
    dt = now - calculate_speed.last_time
    
    if dt > 0.5:  # update ทุก 0.5 วิ
        diff = written_bytes - calculate_speed.last_written
        speed = int(diff / dt / 1024 / 1024)  # MB/s
        calculate_speed.last_time = now
        calculate_speed.last_written = written_bytes
        return speed
    return 0

def cancel_flash():
    """เรียกจาก main process เมื่อ user กด Cancel"""
    _cancel_event.set()
    _pause_event.set()  # unpause ก่อนค่อย cancel

def pause_flash():
    """Pause การเขียน"""
    _pause_event.clear()

def resume_flash():
    """Resume การเขียน"""
    _pause_event.set()
