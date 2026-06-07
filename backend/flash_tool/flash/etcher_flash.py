import os
import win32file
import pywintypes

CHUNK = 4 * 1024 * 1024


def etcher_flash(image_path, physical_drive, progress_cb=None):
    if not os.path.exists(image_path):
        raise FileNotFoundError(image_path)

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

    with open(image_path, "rb") as f:
        while True:
            data = f.read(CHUNK)
            if not data:
                break

            try:
                win32file.WriteFile(handle, data)
            except pywintypes.error as e:
                raise RuntimeError(f"Write failed: {e}")

            written += len(data)

            if progress_cb:
                progress_cb(written / total * 100)

    handle.close()
