import os
import win32file


def ventoy_flash(image_path, device, emit=None):
    CHUNK = 1024 * 1024

    size = os.path.getsize(image_path)
    written = 0

    handle = win32file.CreateFile(
        device,
        win32file.GENERIC_READ | win32file.GENERIC_WRITE,
        win32file.FILE_SHARE_READ | win32file.FILE_SHARE_WRITE,
        None,
        win32file.OPEN_EXISTING,
        0,
        None
    )

    with open(image_path, "rb") as f:
        while True:
            data = f.read(CHUNK)
            if not data:
                break

            win32file.WriteFile(handle, data)

            written += len(data)

            if emit:
                emit("progress", value=written / size * 100)

    handle.close()

    if emit:
        emit("log", msg="Ventoy complete")
