import os
import time
import win32file
import pywintypes


def smart_flash(image_path, device, emit=None):
    chunk = 4 * 1024 * 1024
    min_chunk = 512 * 1024

    size = os.path.getsize(image_path)
    written = 0
    fail = 0

    handle = win32file.CreateFile(
        device,
        win32file.GENERIC_READ | win32file.GENERIC_WRITE,
        win32file.FILE_SHARE_READ | win32file.FILE_SHARE_WRITE,
        None,
        win32file.OPEN_EXISTING,
        win32file.FILE_FLAG_WRITE_THROUGH,
        None
    )

    with open(image_path, "rb") as f:
        while True:
            data = f.read(chunk)
            if not data:
                break

            try:
                win32file.WriteFile(handle, data)
                fail = 0

            except pywintypes.error:
                fail += 1
                time.sleep(0.3)

                if fail > 2 and chunk > min_chunk:
                    chunk //= 2

                continue

            written += len(data)

            if emit:
                emit("progress", value=written / size * 100)

    handle.close()

    if emit:
        emit("log", msg="SMART complete")
