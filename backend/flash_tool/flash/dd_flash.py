import os
import ctypes
from ctypes import wintypes

kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

GENERIC_READ = 0x80000000
GENERIC_WRITE = 0x40000000
OPEN_EXISTING = 3
FILE_ATTRIBUTE_NORMAL = 0x80

CHUNK = 4 * 1024 * 1024


def dd_flash(image_path, device, emit=None):
    size = os.path.getsize(image_path)
    written = 0

    CreateFileW = kernel32.CreateFileW
    CreateFileW.argtypes = [
        wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD,
        wintypes.LPVOID, wintypes.DWORD, wintypes.DWORD, wintypes.HANDLE
    ]
    CreateFileW.restype = wintypes.HANDLE

    WriteFile = kernel32.WriteFile
    WriteFile.argtypes = [
        wintypes.HANDLE, wintypes.LPCVOID,
        wintypes.DWORD, ctypes.POINTER(wintypes.DWORD),
        wintypes.LPVOID
    ]

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
            data = f.read(CHUNK)
            if not data:
                break

            bytes_written = wintypes.DWORD(0)

            ok = WriteFile(
                handle,
                data,
                len(data),
                ctypes.byref(bytes_written),
                None
            )

            if not ok:
                raise RuntimeError("WriteFile failed")

            written += bytes_written.value

            if emit:
                emit("progress", value=written / size * 100)

    CloseHandle(handle)

    if emit:
        emit("log", msg="DD complete (pure API)")
