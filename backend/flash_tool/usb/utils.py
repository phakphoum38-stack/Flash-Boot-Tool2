import subprocess
import re
import time

def extract_device_number(device_path: str) -> str:
    match = re.search(r'PhysicalDrive(\d+)', device_path)
    if not match:
        raise ValueError(f"Invalid device path: {device_path}")
    return match.group(1)

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

def get_drive_letter(device_num: str):
    result = subprocess.run(
        ['powershell', '-Command', 
         f"Get-Disk {device_num} | Get-Partition | Get-Volume | Where-Object {{$_.DriveLetter}} | Select-Object -Expand DriveLetter"],
        capture_output=True, text=True
    )
    return result.stdout.strip()

def wait_for_drive_label(label: str, timeout=10):
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
