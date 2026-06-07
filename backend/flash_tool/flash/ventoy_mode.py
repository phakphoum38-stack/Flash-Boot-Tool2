import os

def ventoy_flash(image_path, device, emit=None):
    CHUNK = 1024 * 1024

    size = os.path.getsize(image_path)
    written = 0

    # ใช้ Python file handle (safe mode)
    with open(device, "wb", buffering=0) as out:
        with open(image_path, "rb") as f:
            while True:
                data = f.read(CHUNK)
                if not data:
                    break

                out.write(data)
                written += len(data)

                if emit:
                    emit("progress", value=written / size * 100)

    if emit:
        emit("log", msg="Ventoy complete (pure)")
