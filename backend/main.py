import sys
import json
import os

try:
    import win32file
    import win32api
except ImportError:
    print(json.dumps({"success": False, "error": "pywin32 not installed"}))
    sys.exit(1)

CHUNK_SIZE = 4 * 1024 * 1024 # 4MB

def flash_iso(iso_path, device_path):
    try:
        if not os.path.exists(iso_path):
            return {"success": False, "error": "ISO file not found"}

        # เปิดไฟล์ ISO อ่านอย่างเดียว
        with open(iso_path, 'rb') as iso_file:
            iso_size = os.path.getsize(iso_path)

            # เปิด device สำหรับเขียน
            handle = win32file.CreateFileW(
                f"\\\\.\\{device_path}",
                win32file.GENERIC_WRITE,
                0, None,
                win32file.OPEN_EXISTING,
                0, None
            )

        written_total = 0

        while True:
            chunk = iso_file.read(CHUNK_SIZE)
            if not chunk:
                break

            win32file.WriteFile(handle, chunk)
            written_total += len(chunk)

            progress = int(written_total * 100 / iso_size)
            print(json.dumps({"progress": progress}), flush=True)

        win32file.CloseHandle(handle)
        return {"success": True, "message": "Flash completed"}

    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"success": False, "error": "Usage: backend.exe flash <iso_path> <device>"}))
        sys.exit(1)

    command = sys.argv[1]
    if command == "flash":
        iso_path = sys.argv[2]
        device = sys.argv[3]
        result = flash_iso(iso_path, device)
        print(json.dumps(result))
