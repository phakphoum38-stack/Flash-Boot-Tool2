import os
import ctypes
import time
import queue
import threading
import hashlib

kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

CHUNK = 4 * 1024 * 1024

GENERIC_WRITE = 0x40000000
OPEN_EXISTING = 3
FILE_SHARE = 0x00000003
FILE_FLAG_WRITE_THROUGH = 0x80000000


class DiskWriterV7:
    def __init__(self, device, emit=None):
        self.device = device
        self.emit = emit
        self.q = queue.Queue()
        self.running = True
        self.written = 0

    def log(self, msg):
        if self.emit:
            self.emit("log", msg=msg)

    def open_disk(self):
        return kernel32.CreateFileW(
            self.device,
            GENERIC_WRITE,
            FILE_SHARE,
            None,
            OPEN_EXISTING,
            FILE_FLAG_WRITE_THROUGH,
            None
        )

    def worker(self, handle, total_size):
        while self.running:
            try:
                chunk = self.q.get(timeout=1)
            except:
                continue

            if chunk is None:
                break

            bytes_written = ctypes.c_uint32(0)

            ok = kernel32.WriteFile(
                handle,
                chunk,
                len(chunk),
                ctypes.byref(bytes_written),
                None
            )

            if not ok:
                self.log("WRITE FAIL → retry queue")
                self.q.put(chunk)
                time.sleep(0.1)
                continue

            self.written += bytes_written.value

            if self.emit:
                self.emit("progress", value=(self.written / total_size) * 100)

    def write(self, image_path):
        size = os.path.getsize(image_path)

        handle = self.open_disk()

        t = threading.Thread(target=self.worker, args=(handle, size))
        t.start()

        with open(image_path, "rb") as f:
            while True:
                data = f.read(CHUNK)
                if not data:
                    break
                self.q.put(data)

        self.q.put(None)
        t.join()

        kernel32.CloseHandle(handle)

        self.log("V7 COMPLETE")
