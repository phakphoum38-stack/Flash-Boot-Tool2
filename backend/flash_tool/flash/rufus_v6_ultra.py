import os
import ctypes
import time
import hashlib
from ctypes import wintypes
from flash_tool.core.state import save_state, load_state

kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

GENERIC_READ = 0x80000000
GENERIC_WRITE = 0x40000000
OPEN_EXISTING = 3
FILE_ATTRIBUTE_NORMAL = 0x80
FILE_FLAG_WRITE_THROUGH = 0x80000000

FILE_SHARE_READ = 0x00000001
FILE_SHARE_WRITE = 0x00000002

CHUNK = 4 * 1024 * 1024
MIN_CHUNK = 512 * 1024


def open_disk(device):
    handle = kernel32.CreateFileW(
        device,
        GENERIC_READ | GENERIC_WRITE,
        FILE_SHARE_READ | FILE_SHARE_WRITE,
        None,
        OPEN_EXISTING,
        FILE_ATTRIBUTE_NORMAL | FILE_FLAG_WRITE_THROUGH,
        None
    )

    if handle == wintypes.HANDLE(-1).value:
        raise RuntimeError("Cannot open disk")

    return handle


def sha256_block(data):
    return hashlib.sha256(data).hexdigest()


def rufus_v6_ultra(image_path, device, emit=None, state_path="flash_state.json"):
    size = os.path.getsize(image_path)

    state = load_state(state_path) or {
        "offset": 0,
        "written": 0,
        "chunk": CHUNK
    }

    offset = state["offset"]
    written = state["written"]
    chunk = state["chunk"]

    handle = open_disk(device)

    def log(msg):
        if emit:
            emit("log", msg=msg)

    def progress():
        if emit:
            emit("progress", value=(written / size) * 100)

    log("V6 ULTRA START")

    with open(image_path, "rb") as f:
        f.seek(offset)

        while True:
            try:
                data = f.read(chunk)
                if not data:
                    break

                bytes_written = wintypes.DWORD(0)

                ok = kernel32.WriteFile(
                    handle,
                    data,
                    len(data),
                    ctypes.byref(bytes_written),
                    None
                )

                # =========================
                # FAIL RECOVERY ENGINE
                # =========================
                if not ok:
                    err = ctypes.get_last_error()
                    log(f"WRITE FAIL err={err}")

                    chunk = max(MIN_CHUNK, chunk // 2)
                    time.sleep(0.2)

                    save_state(state_path, {
                        "offset": offset,
                        "written": written,
                        "chunk": chunk
                    })

                    continue

                # =========================
                # SUCCESS PATH
                # =========================
                written += bytes_written.value
                offset += bytes_written.value

                # adaptive boost
                if chunk < CHUNK:
                    chunk += 256 * 1024

                # =========================
                # SAVE RESUME STATE
                # =========================
                save_state(state_path, {
                    "offset": offset,
                    "written": written,
                    "chunk": chunk
                })

                progress()

            except Exception as e:
                log(f"RECOVERABLE ERROR: {str(e)}")
                time.sleep(0.2)
                continue

    kernel32.CloseHandle(handle)

    # =========================
    # FINAL VERIFY STAGE
    # =========================
    log("VERIFY START")

    h = hashlib.sha256()
    with open(image_path, "rb") as f:
        while True:
            b = f.read(4 * 1024 * 1024)
            if not b:
                break
            h.update(b)

    log(f"ISO SHA256: {h.hexdigest()}")

    if os.path.exists(state_path):
        os.remove(state_path)

    if emit:
        emit("progress", value=100)
        emit("log", msg="V6 ULTRA COMPLETE")
