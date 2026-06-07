import re
import shutil
import time
from pathlib import Path
from flash_tool.usb.utils import (
    extract_device_number, 
    run_diskpart, 
    get_drive_letter
)

def smart_flash(iso_path: Path, device_path: str, emit):
    emit("log", level="info", msg=f"Starting Smart mode for {iso_path.name}")
    device_num = extract_device_number(device_path)
    
    # 1. Clean
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
    
    time.sleep(2)
    drive_letter = get_drive_letter(device_num)
    if not drive_letter:
        raise Exception("Failed to get drive letter")
    
    emit("log", level="info", msg=f"Mounted to {drive_letter}:")
    
    # 3. Mount ISO
    emit("log", level="info", msg="Mounting ISO...")
    iso_drive = mount_iso(iso_path)
    
    try:
        emit("log", level="info", msg="Copying files...")
        copy_files(f"{iso_drive}:\\", f"{drive_letter}:\\", emit)
        
        emit("log", level="info", msg="Installing bootloader...")
        install_bootloader(drive_letter, emit)
        
    finally:
        unmount_iso(iso_path)
        emit("log", level="info", msg="Smart flash completed")
        emit("result", success=True, msg="Smart flash completed")

def mount_iso(iso_path: Path):
    import subprocess
    result = subprocess.run(
        ['powershell', 'Mount-DiskImage', '-ImagePath', str(iso_path), '-PassThru'],
        capture_output=True, text=True
    )
    match = re.search(r'DriveLetter\s+:\s+(\w)', result.stdout)
    if not match:
        raise Exception("Failed to mount ISO")
    return match.group(1)

def unmount_iso(iso_path: Path):
    import subprocess
    subprocess.run(['powershell', 'Dismount-DiskImage', '-ImagePath', str(iso_path)], capture_output=True)

def copy_files(src: str, dst: str, emit):
    import shutil
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

def install_bootloader(drive_letter: str, emit):
    import shutil
    efi_path = Path(f"{drive_letter}:\\EFI\\BOOT")
    efi_path.mkdir(parents=True, exist_ok=True)
    grub_src = Path(__file__).parent.parent / "resources" / "grubx64.efi"
    if grub_src.exists():
        shutil.copy2(grub_src, efi_path / "bootx64.efi")
        emit("log", level="info", msg="Bootloader installed")
    else:
        emit("log", level="warn", msg="grubx64.efi not found, skipping bootloader")
