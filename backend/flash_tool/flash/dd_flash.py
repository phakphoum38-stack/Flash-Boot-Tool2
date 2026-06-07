import os
import win32file
import pywintypes

CHUNK = 4 * 1024 * 1024


def dd_flash(image_path, device, emit=None):
    size = os.path.getsize(image_path)
    written = 0

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
            data = f.read(CHUNK)
            if not data:
                break

            try:
                win32file.WriteFile(handle, data)
            except pywintypes.error as e:
                if emit:
                    emit("error", msg=str(e))
                raise

            written += len(data)

            if emit:
                emit("progress", value=written / size * 100)

    handle.close()

    if emit:
        emit("log", msg="DD complete")
