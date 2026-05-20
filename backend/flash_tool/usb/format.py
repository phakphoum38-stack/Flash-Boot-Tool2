import subprocess
import re

def create_partition(device_path: str, label="VENTOY"):
    """
    ใช้ diskpart สร้าง GPT + 1 partition FAT32
    device_path = '\\\\.\\PhysicalDrive1' -> ต้องแปลงเป็นเลข 1
    """
    device_num = extract_device_number(device_path)
    
    script = f"""
    select disk {device_num}
    clean
    convert gpt
    create partition primary
    format fs=fat32 quick label={label}
    assign
    exit
    """
    
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
    """\\\\.\\PhysicalDrive1 -> 1"""
    match = re.search(r'PhysicalDrive(\d+)', device_path)
    if not match:
        raise ValueError(f"Invalid device path: {device_path}")
    return match.group(1)

def get_drive_letter(device_path: str):
    """หา drive letter หลัง format เสร็จ"""
    device_num = extract_device_number(device_path)
    result = subprocess.run(
        ['powershell', 'Get-Disk', device_num, '|', 'Get-Partition', '|', 'Get-Volume'],
        capture_output=True, text=True
    )
    # parse output หา drive letter
    return result.stdout.strip()
