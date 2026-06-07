import os
import ctypes
import time
from ctypes import wintypes

kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

GENERIC_READ = 0x80000000
GENERIC_WRITE = 0x40000000
OPEN_EXISTING = 3
FILE_ATTRIBUTE_NORMAL = 0x80

FILE_SHARE_READ = 0x00000001
FILE_SHARE_WRITE = 0x00000002

FSCTL_LOCK_VOLUME = 0x00090018
FSCTL_DISMOUNT_VOLUME = 0x00090020

CHUNK = 4 * 1024 * 1024


def etcher_flash(image_path, device, emit=None):
    size = os.path.getsize(image_path)
    written = 0

    # 🔥 validate device
    if "PhysicalDrive" not in device:
        raise RuntimeError("Use \\\\.\\PhysicalDriveX only")

    CreateFileW = kernel32.CreateFileW
    WriteFile = kernel32.WriteFile
    CloseHandle = kernel32.CloseHandle
    DeviceIoControl = kernel32.DeviceIoControl

    handle = CreateFileW(
        device,
        GENERIC_READ | GENERIC_WRITE,
        FILE_SHARE_READ | FILE_SHARE_WRITE,
        None,
        OPEN_EXISTING,
        FILE_ATTRIBUTE_NORMAL,
        None
    )

    if handle == wintypes.HANDLE(-1).value:
        raise RuntimeError("USB access denied (run as admin or device locked)")

    # 🔥 LOCK + DISMOUNT (critical fix)
    DeviceIoControl(handle, FSCTL_LOCK_VOLUME, None, 0, None, 0, ctypes.byref(wintypes.DWORD()), None)
    DeviceIoControl(handle, FSCTL_DISMOUNT_VOLUME, None, 0, None, 0, ctypes.byref(wintypes.DWORD()), None)

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

            # 🔥 FIX: check result
            if not ok:
                err = ctypes.get_last_error()

                if err == 5:
                    time.sleep(0.3)
                    continue

                raise RuntimeError(f"WriteFile failed: {err}")

            written += bytes_written.value

            if emit:
                try:
                    emit("progress", value=written / size * 100)
                except:
                    pass

    CloseHandle(handle)

    if emit:
        try:
            emit("log", msg="ETCHER COMPLETE")
        except:
            pass
