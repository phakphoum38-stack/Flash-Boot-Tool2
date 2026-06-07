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

    emit("log", msg=f"Starting DD mode: {iso_path.name}")

    CHUNK = 4 * 1024 * 1024

    size = iso_path.stat().st_size
    written = 0

    last_written = 0
    last_speed_time = time.time()

    try:
        handle = win32file.CreateFileW(
            device_path,
            win32file.GENERIC_READ | win32file.GENERIC_WRITE,
            win32file.FILE_SHARE_READ |
            win32file.FILE_SHARE_WRITE,
            None,
            win32file.OPEN_EXISTING,
            0,
            None
        )

        with open(iso_path, "rb") as f:
            while True:

                if _cancel_event.is_set():
                    emit("log", msg="Flash cancelled")
                    break

                _pause_event.wait()

                chunk = f.read(CHUNK)

                if not chunk:
                    break

                win32file.WriteFile(handle, chunk)

                written += len(chunk)

                now = time.time()

                if now - last_speed_time >= 0.5:
                    speed = int(
                        (written - last_written)
                        / (now - last_speed_time)
                        / 1024
                        / 1024
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
                    speed=speed,
                )

        win32file.CloseHandle(handle)

        emit("log", msg="Write completed")

    except Exception as e:
        emit("error", msg=str(e))


def cancel_flash():
    _cancel_event.set()
    _pause_event.set()


def pause_flash():
    _pause_event.clear()


def resume_flash():
    _pause_event.set()
