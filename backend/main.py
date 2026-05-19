import sys
import json
import subprocess
import platform

def flash_iso(iso_path, device):
    try:
        system = platform.system()

        if system == "Windows":
            # ใช้ diskpart หรือ raw write ผ่าน pywin32
            cmd = ["powershell", "-Command",
                   f"Get-Content '{iso_path}' -Encoding Byte | Set-Content -Path '\\\\.\\{device}' -Encoding Byte"]
        else:
            cmd = ["dd", f"if={iso_path}", f"of={device}", "bs=4M", "status=progress"]

        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)

        return {"success": proc.returncode == 0, "stdout": proc.stdout, "stderr": proc.stderr}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    command = sys.argv[1]
    if command == "flash":
        iso_path = sys.argv[2]
        device = sys.argv[3]
        result = flash_iso(iso_path, device)
        print(json.dumps(result))
