import os
import time
import win32file
import pywintypes


def smart_flash(image_path, physical_drive, progress_cb=None):
    chunk = 4 * 1024 * 1024
    min_chunk = 512 * 1024

    handle = win32file.CreateFile(
        physical_drive,
        win32file.GENERIC_READ | win32file.GENERIC_WRITE,
        win32file.FILE_SHARE_READ | win32file.FILE_SHARE_WRITE,
        None,
        win32file.OPEN_EXISTING,
        win32file.FILE_FLAG_WRITE_THROUGH,
        None
    )

    total = os.path.getsize(image_path)
    written = 0
    fail_count = 0

    with open(image_path, "rb") as f:
        while True:
            data = f.read(chunk)
            if not data:
                break

            try:
                win32file.WriteFile(handle, data)
                fail_count = 0

            except pywintypes.error:
                fail_count += 1
                time.sleep(0.5)

                # ลด chunk ถ้า error เยอะ
                if fail_count > 2 and chunk > min_chunk:
                    chunk //= 2

                continue

            written += len(data)

            if progress_cb:
                progress_cb(written / total * 100)

    handle.close()
