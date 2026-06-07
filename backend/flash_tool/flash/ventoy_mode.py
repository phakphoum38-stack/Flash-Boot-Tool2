import os
import win32file


def ventoy_mode(image_path, physical_drive, progress_cb=None):
    CHUNK = 1024 * 1024  # เบากว่า etcher

    handle = win32file.CreateFile(
        physical_drive,
        win32file.GENERIC_READ | win32file.GENERIC_WRITE,
        win32file.FILE_SHARE_READ | win32file.FILE_SHARE_WRITE,
        None,
        win32file.OPEN_EXISTING,
        0,
        None
    )

    total = os.path.getsize(image_path)
    written = 0

    with open(image_path, "rb") as f:
        while True:
            data = f.read(CHUNK)
            if not data:
                break

            win32file.WriteFile(handle, data)

            written += len(data)

            if progress_cb:
                progress_cb(written / total * 100)

    handle.close()
