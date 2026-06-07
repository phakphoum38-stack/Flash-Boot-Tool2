import win32file
import threading
import time
from pathlib import Path

_cancel_event = threading.Event()
_pause_event = threading.Event()
_pause_event.set()

def dd_flash(iso_path: Path, device_path: str, emit):
_cancel_event.clear()
_pause_event.set()

```
emit(
    "log",
    level="info",
    msg=f"Starting DD flash: {iso_path.name}"
)

emit(
    "log",
    level="info",
    msg=f"Device: {device_path}"
)

CHUNK_SIZE = 4 * 1024 * 1024

try:
    size = iso_path.stat().st_size

    handle = win32file.CreateFile(
        device_path,
        win32file.GENERIC_WRITE,
        win32file.FILE_SHARE_READ |
        win32file.FILE_SHARE_WRITE,
        None,
        win32file.OPEN_EXISTING,
        0,
        None
    )

    written = 0
    last_written = 0
    last_speed_time = time.time()

    with open(iso_path, "rb") as iso_file:

        while True:

            if _cancel_event.is_set():
                emit(
                    "log",
                    level="warn",
                    msg="Flash cancelled"
                )

                win32file.CloseHandle(handle)
                return

            _pause_event.wait()

            chunk = iso_file.read(CHUNK_SIZE)

            if not chunk:
                break

            win32file.WriteFile(
                handle,
                chunk
            )

            written += len(chunk)

            now = time.time()

            if now - last_speed_time >= 0.5:

                speed = int(
                    (written - last_written)
                    /
                    (now - last_speed_time)
                    /
                    1024
                    /
                    1024
                )

                last_written = written
                last_speed_time = now

            else:
                speed = 0

            progress = int(
                written * 100 / size
            )

            emit(
                "progress",
                value=progress,
                written=written,
                total=size,
                speed=speed
            )

    win32file.FlushFileBuffers(handle)
    win32file.CloseHandle(handle)

    emit(
        "progress",
        value=100,
        written=size,
        total=size,
        speed=0
    )

    emit(
        "log",
        level="info",
        msg="Write completed"
    )

except Exception as e:
    emit(
        "error",
        msg=str(e)
    )
```

def cancel_flash():
_cancel_event.set()
_pause_event.set()

def pause_flash():
_pause_event.clear()

def resume_flash():
_pause_event.set()
