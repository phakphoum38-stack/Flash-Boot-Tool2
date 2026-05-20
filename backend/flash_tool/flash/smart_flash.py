import shutil
import tempfile
from pathlib import Path
import parted
import win32file

def smart_flash(iso_path: Path, device_path: str, emit):
    emit("log", level="info", msg=f"Starting Smart mode for {iso_path.name}")

    # 1. Unmount device ก่อน
    emit("log", level="info", msg="Unmounting USB device...")
    unmount_device(device_path)

    # 2. สร้าง partition table GPT + 1 partition FAT32
    emit("log", level="info", msg="Creating GPT partition table...")
    device = parted.getDevice(device_path)
    disk = parted.freshDisk(device, 'gpt')

    geometry = parted.Geometry(device=device, start=2048, end=device.length - 2048)
    fs = parted.FileSystem(type='fat32', geometry=geometry)
    partition = parted.Partition(
        disk=disk,
        type=parted.PARTITION_NORMAL,
        fs=fs,
        geometry=geometry
    )
    disk.addPartition(partition, geometry)
    disk.commit()
    emit("log", level="info", msg="Partition created")

    # 3. Mount partition ชั่วคราว
    drive_letter = mount_partition(device_path, partition.number)
    emit("log", level="info", msg=f"Mounted to {drive_letter}:")

    try:
        # 4. Mount ISO และ copy ไฟล์
        mount_point = mount_iso(iso_path)
        try:
            emit("log", level="info", msg="Copying files from ISO...")
            copy_files(mount_point, drive_letter, emit)
        finally:
            unmount_iso(mount_point)

        # 5. ติดตั้ง GRUB bootloader
        emit("log", level="info", msg="Installing GRUB bootloader...")
        install_grub(drive_letter)

    finally:
        unmount_device(device_path)
        emit("log", level="info", msg="Smart flash completed")

def unmount_device(device_path):
    # ใช้ DiskPart สั่ง clean unmount
    import subprocess
    script = f"select disk {device_path[-1]}\nclean\n"
    subprocess.run(['diskpart'], input=script, text=True, capture_output=True)

def mount_partition(device_path, partition_num):
    # หา drive letter ที่ windows assign ให้
    import win32api
    for drive in win32api.GetLogicalDriveStrings().split('\000')[:-1]:
        if device_path in get_device_from_drive(drive):
            return drive[0]
    return None

def mount_iso(iso_path):
    # ใช้ PowerShell mount ISO
    import subprocess
    result = subprocess.run(
        ['powershell', 'Mount-DiskImage', '-ImagePath', str(iso_path), '-PassThru'],
        capture_output=True, text=True
    )
    # ดึง drive letter จาก output
    #... implement ต่อ
    return "E:"

def copy_files(src, dst, emit):
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
        if copied % 100 == 0:
            progress = int(copied * 100 / total)
            emit("progress", value=progress)

def install_grub(drive_letter):
    # ใช้ grub-install หรือ copy grubx64.efi เข้า EFI/BOOT
    efi_path = Path(drive_letter) / "EFI" / "BOOT"
    efi_path.mkdir(parents=True, exist_ok=True)
    # copy grubx64.efi จาก backend/resources/
    pass

def get_device_from_drive(drive):
    # helper หา device path จาก drive letter
    return ""
