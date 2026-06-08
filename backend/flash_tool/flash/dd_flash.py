import os
import ctypes
import time
import msvcrt
import pywintypes
import win32file
import winioctlcon

def unmount_volume(drive_letter=None, device_path=None):
    """
    พยายาม lock + dismount volume ก่อนเขียน raw disk
    """
    try:
        if drive_letter:
            path = f"\\\\.\\{drive_letter}:"
        else:
            path = device_path

        handle = win32file.CreateFile(
            path,
            win32file.GENERIC_READ | win32file.GENERIC_WRITE,
            win32file.FILE_SHARE_READ | win32file.FILE_SHARE_WRITE,
            None,
            win32file.OPEN_EXISTING,
            0,
            None
        )

        # lock volume
        win32file.DeviceIoControl(
            handle,
            winioctlcon.FSCTL_LOCK_VOLUME,
            None,
            0
        )

        # dismount volume
        win32file.DeviceIoControl(
            handle,
            winioctlcon.FSCTL_DISMOUNT_VOLUME,
            None,
            0
        )

        return handle

    except Exception as e:
        print("[WARN] unmount failed:", e)
        return None


def dd_write(image_path, physical_drive):
    """
    Write ISO/DD image to \\.\PHYSICALDRIVE*
    """

    if not os.path.exists(image_path):
        raise FileNotFoundError(image_path)

    # เปิด disk แบบ raw
    handle = win32file.CreateFile(
        physical_drive,
        win32file.GENERIC_READ | win32file.GENERIC_WRITE,
        win32file.FILE_SHARE_READ | win32file.FILE_SHARE_WRITE,
        None,
        win32file.OPEN_EXISTING,
        win32file.FILE_FLAG_NO_BUFFERING | win32file.FILE_FLAG_WRITE_THROUGH,
        None
    )

    file_size = os.path.getsize(image_path)
    chunk_size = 4 * 1024 * 1024  # 4MB buffer

    written = 0

    with open(image_path, "rb") as f:
        while True:
            data = f.read(chunk_size)
            if not data:
                break

            try:
                win32file.WriteFile(handle, data)
            except pywintypes.error as e:
                print("[ERROR] Write failed:", e)
                print("Retrying in 1s...")
                time.sleep(1)
                continue

            written += len(data)
            progress = (written / file_size) * 100
            print(f"\rProgress: {progress:.2f}%", end="")

    handle.close()
    print("\nDone ✔")


def safe_flash(image_path, physical_drive):
    """
    wrapper: ลดปัญหา Windows lock USB
    """

    print("[*] Preparing device...")

    # พยายามปลด volume ก่อน
    unmount_volume(device_path=physical_drive)

    time.sleep(2)

    print("[*] Start writing...")
    dd_write(image_path, physical_drive)