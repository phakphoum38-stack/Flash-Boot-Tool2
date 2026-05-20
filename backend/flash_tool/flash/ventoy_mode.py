import subprocess
import shutil
import tempfile
import zipfile
from pathlib import Path

def ventoy_flash(iso_path: Path, device_path: str, emit):
    """
    1. ติดตั้ง Ventoy ลง USB
    2. Copy ISO เข้าไปใน partition Ventoy
    """
    device_num = extract_device_number(device_path)
    
    emit("log", level="info", msg="Installing Ventoy...")
    install_ventoy(device_num, emit)
    
    # รอให้ Windows mount partition Ventoy
    emit("log", level="info", msg="Waiting for Ventoy partition...")
    drive_letter = wait_for_drive_label("Ventoy", timeout=10)
    
    if not drive_letter:
        raise Exception("Ventoy partition not found")
    
    emit("log", level="info", msg=f"Ventoy mounted at {drive_letter}:")
    
    # Copy ISO เข้าไป
    emit("log", level="info", msg=f"Copying {iso_path.name} to Ventoy...")
    dest_path = Path(f"{drive_letter}:\\") / iso_path.name
    shutil.copy2(iso_path, dest_path)
    
    emit("progress", value=100, written=iso_path.stat().st_size, total=iso_path.stat().st_size)
    emit("log", level="info", msg="Ventoy flash completed")
    emit("result", success=True, msg="Ventoy flash completed")

def install_ventoy(device_num: str, emit):
    """
    เรียก Ventoy2Disk.exe แบบ silent
    ต้อง bundle Ventoy มากับ backend/resources/ventoy/
    """
    ventoy_exe = Path(__file__).parent.parent / "resources" / "ventoy" / "Ventoy2Disk.exe"
    
    if not ventoy_exe.exists():
        raise FileNotFoundError("Ventoy2Disk.exe not found in resources")
    
    # Ventoy2Disk.exe -i /Device/PhysicalDrive1
    cmd = [
        str(ventoy_exe),
        "-i",
        f"/Device/PhysicalDrive{device_num}",
        "-r", "0"  # reserve 0 MB
    ]
    
    emit("log", level="info", msg="Running Ventoy installer...")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    
    if result.returncode != 0:
        raise Exception(f"Ventoy install failed: {result.stderr}")
    
    emit("log", level="info", msg="Ventoy installed successfully")

def extract_device_number(device_path: str) -> str:
    import re
    match = re.search(r'PhysicalDrive(\d+)', device_path)
    if not match:
        raise ValueError(f"Invalid device path: {device_path}")
    return match.group(1)

def wait_for_drive_label(label: str, timeout=10):
    import time
    import subprocess
    
    for _ in range(timeout):
        result = subprocess.run(
            ['powershell', '-Command', 
             f"Get-Volume | Where-Object {{$_.FileSystemLabel -eq '{label}'}} | Select-Object -Expand DriveLetter"],
            capture_output=True, text=True
        )
        drive = result.stdout.strip()
        if drive:
            return drive
        time.sleep(1)
    return None
