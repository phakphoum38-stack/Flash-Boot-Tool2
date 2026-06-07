import os
import ctypes
from ctypes import wintypes
import time

kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

GENERIC_READ = 0x80000000
GENERIC_WRITE = 0x40000000
OPEN_EXISTING = 3
FILE_ATTRIBUTE_NORMAL = 0x80

CHUNK = 4 * 1024 * 1024
MIN_CHUNK = 512 * 1024


def smart_flash(image_path, device, emit=None):
    size = os.path.getsize(image_path)
    written = 0
    chunk = CHUNK

    CreateFileW = kernel32.CreateFileW
    WriteFile = kernel32.WriteFile
    CloseHandle = kernel32.CloseHandle

    handle = CreateFileW(
        device,
        GENERIC_READ | GENERIC_WRITE,
        0,
        None,
        OPEN_EXISTING,
        FILE_ATTRIBUTE_NORMAL,
        None
    )

    if handle == wintypes.HANDLE(-1).value:
        raise RuntimeError("Failed to open device")

    with open(image_path, "rb") as f:
        while True:
            data = f.read(chunk)
            if not data:
                break

            bytes_written = wintypes.DWORD(0)

            ok = WriteFile(handle, data, len(data), ctypes.byref(bytes_written), None)

            if not ok:
                time.sleep(0.2)
                chunk = max(MIN_CHUNK, chunk // 2)
                continue

            written += bytes_written.value

            if emit:
                emit("progress", value=written / size * 100)

    CloseHandle(handle)

    if emit:
        emit("log", msg="SMART complete (pure API)")
