import os
import ctypes
import time
from ctypes import wintypes

kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

GENERIC_READ = 0x80000000
GENERIC_WRITE = 0x40000000
OPEN_EXISTING = 3

FILE_SHARE_READ = 0x00000001
FILE_SHARE_WRITE = 0x00000002

CHUNK = 4 * 1024 * 1024


def _open_device(device):
    CreateFileW = kernel32.CreateFileW

    for _ in range(15):  # 🔥 retry fix error=5
        h = CreateFileW(
            device,
            GENERIC_READ | GENERIC_WRITE,
            FILE_SHARE_READ | FILE_SHARE_WRITE,
            None,
            OPEN_EXISTING,
            0,
            None
        )

        if h not in (-1, 0):
            return h

        time.sleep(0.3)

    raise RuntimeError("Cannot open USB (locked or permission denied)")


def rufus_v3_flash(image_path, device, emit=None):
    size = os.path.getsize(image_path)
    written = 0

    device = device.replace(" ", "")  # 🔥 FIX 1: sanitize

    handle = _open_device(device)

    with open(image_path, "rb") as f:
        while True:
            data = f.read(CHUNK)
            if not data:
                break

            bytes_written = wintypes.DWORD(0)

            ok = kernel32.WriteFile(
                handle,
                data,
                len(data),
                ctypes.byref(bytes_written),
                None
            )

            if not ok:
                time.sleep(0.2)
                continue

            written += bytes_written.value

            if emit:
                emit("progress", value=(written / size) * 100)

    kernel32.FlushFileBuffers(handle)
    kernel32.CloseHandle(handle)

    if emit:
        emit("log", msg="RUFUS v3 COMPLETE")
