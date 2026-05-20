import shutil
import subprocess
import re
import time
from pathlib import Path
import win32api
import win32file

def smart_flash(iso_path: Path, device_path: str, emit):
    emit("log", level="info", msg=f"Starting Smart mode for {iso_path.name}")

    device_num = extract_device_number(device_path)
    
    # 1. Unmount & Clean
    emit("log", level="info", msg="Cleaning USB device...")
    run_diskpart(f"select disk {device_num}\nclean\nconvert gpt\n")
    
    # 2. Create partition
    emit("log", level="info", msg="Creating FAT32 partition...")
    run_diskpart(f"""
    select disk {device_num}
    create partition primary
    format fs=fat32 quick label=FLASH
    assign
    exit
    """)
    
    # 3. รอให้ Windows mount
    time.sleep(2)
    drive_letter = get_drive_letter(device_num)
    if not drive_letter:
        raise Exception("Failed to get drive letter")
    
    emit("log", level="info", msg=f"Mounted to {drive_letter}:")
    
    # 4. Mount ISO
    emit("log", level="info", msg="Mounting ISO...")
    iso_drive = mount_iso(iso_path)
    
    try:
        # 5. Copy files
        emit("log", level="info", msg="Copying files...")
        copy_files(f"{iso_drive}:\\", f"{drive_letter}:\\", emit)
        
        # 6. Install bootloader
        emit("log", level="info", msg="Installing bootloader...")
        install_bootloader(drive_letter)
        
    finally:
        unmount_iso(iso_path)
        emit("log", level="info", msg="Smart flash completed")

def run_diskpart(script: str):
    result = subprocess.run(
        ['diskpart'], 
        input=script, 
        text=True, 
        capture_output=True
    )
    if result.returncode != 0:
        raise Exception(f"diskpart failed: {result.stderr}")
    return result.stdout

def extract_device_number(device_path: str) -> str:
    match = re.search(r'PhysicalDrive(\d+)', device_path)
    if not match:
        raise ValueError(f"Invalid device path: {device_path}")
    return match.group(1)

def get_drive_letter(device_num: str):
    result = subprocess.run(
        ['powershell', '-Command', 
         f"Get-Disk {device_num} | Get-Partition | Get-Volume | Where-Object {{$_.DriveLetter}} | Select-Object -Expand DriveLetter"],
        capture_output=True, text=True
    )
    return result.stdout.strip()

def mount_iso(iso_path: Path):
    result = subprocess.run(
        ['powershell', 'Mount-DiskImage', '-ImagePath', str(iso_path), '-PassThru'],
        capture_output=True, text=True
    )
    # ดึง drive letter จาก output
    match = re.search(r'DriveLetter\s+:\s+(\w)', result.stdout)
    if not match:
        raise Exception("Failed to mount ISO")
    return match.group(1)

def unmount_iso(iso_path: Path):
    subprocess.run(
        ['powershell', 'Dismount-DiskImage', '-ImagePath', str(iso_path)],
        capture_output=True
    )

def copy_files(src: str, dst: str, emit):
    total = sum(1 for _ in Path(src).rglob('*'))
    copied = 0
    
    for item in Path(src).rglob('*'):
        rel = item.relative_to(src)
        target = Path(dst) / rel
        if item.is_dir():
            target.mkdir(parents=True, exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, target)
        
        copied += 1
        if copied % 200 == 0 or copied == total:
            progress = int(copied * 100 / total)
            emit("progress", value=progress, written=copied, total=total)

def install_bootloader(drive_letter: str):
    # ใช้ bootsect หรือ bcdboot สำหรับ Windows ISO
    # ถ้าเป็น Linux ISO ใช้ grubx64.efi
    efi_path = Path(f"{drive_letter}:\\EFI\\BOOT")
    efi_path.mkdir(parents=True, exist_ok=True)
    
    # ตัวอย่าง: copy grubx64.efi ที่ bundle มากับ backend
    grub_src = Path(__file__).parent.parent / "resources" / "grubx64.efi"
    if grub_src.exists():
        shutil.copy2(grub_src, efi_path / "bootx64.efi")
    
    emit_log = lambda msg: None  # placeholder ถ้าอยาก log เพิ่ม
