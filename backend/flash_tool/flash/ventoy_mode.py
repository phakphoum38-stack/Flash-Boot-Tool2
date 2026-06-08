import shutil
from pathlib import Path
from flash_tool.usb.utils import extract_device_number, wait_for_drive_label

def ventoy_flash(iso_path: Path, device_path: str, emit):
    device_num = extract_device_number(device_path)
    
    emit("log", level="info", msg="Installing Ventoy...")
    install_ventoy(device_num, emit)
    
    emit("log", level="info", msg="Waiting for Ventoy partition...")
    drive_letter = wait_for_drive_label("Ventoy", timeout=10)
    
    if not drive_letter:
        raise Exception("Ventoy partition not found")
    
    emit("log", level="info", msg=f"Ventoy mounted at {drive_letter}:")
    
    emit("log", level="info", msg=f"Copying {iso_path.name} to Ventoy...")
    dest_path = Path(f"{drive_letter}:\\") / iso_path.name
    shutil.copy2(iso_path, dest_path)
    
    emit("progress", value=100, written=iso_path.stat().st_size, total=iso_path.stat().st_size)
    emit("log", level="info", msg="Ventoy flash completed")

def install_ventoy(device_num: str, emit):
    import subprocess
    ventoy_dir = (
Path(**file**).parent.parent
/ "resources"
/ "ventoy"
)

candidates = [
ventoy_dir / "Ventoy2Disk_X64.exe",
ventoy_dir / "Ventoy2Disk.exe"
]

ventoy_exe = None

for exe in candidates:

```
if exe.exists():

    ventoy_exe = exe

    break
```

if ventoy_exe is None:

```
raise FileNotFoundError(
    "Ventoy executable not found"
)
```

    
    if not ventoy_exe.exists():
        raise FileNotFoundError("Ventoy2Disk.exe not found in resources")
    
    cmd = [str(ventoy_exe), "-i", f"/Device/PhysicalDrive{device_num}", "-r", "0"]
    emit("log", level="info", msg="Running Ventoy installer...")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    
    if result.returncode != 0:
        raise Exception(f"Ventoy install failed: {result.stderr}")
    
    emit("log", level="info", msg="Ventoy installed successfully")
