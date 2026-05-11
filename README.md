# Flash-Boot-Tool2
:writing{variant="standard" id="48127"}
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import os
import json
import time
import hashlib
import subprocess
import traceback
import platform

app = FastAPI(title="Flash Boot Tool PRO")

# =========================
# 📦 MODEL
# =========================
class FlashRequest(BaseModel):
    iso: str
    device: str


# =========================
# ❤️ HEALTH
# =========================
@app.get("/")
def root():
    return {
        "status": "ok",
        "app": "Flash Boot Tool PRO"
    }


# =========================
# 💽 USB DETECT
# =========================
@app.get("/devices")
def devices():

    system = platform.system()

    try:

        # =========================
        # 🪟 WINDOWS
        # =========================
        if system == "Windows":

            cmd = [
                "powershell",
                "-Command",
                """
Get-CimInstance Win32_DiskDrive |
Where-Object {$_.InterfaceType -eq 'USB'} |
Select DeviceID,Model,Size |
ConvertTo-Json
"""
            ]

            out = subprocess.check_output(cmd)
            data = json.loads(out)

            if isinstance(data, dict):
                data = [data]

            result = []

            for d in data:

                size = int(d["Size"]) / (10243)

                result.append({
                    "path": d["DeviceID"],
                    "model": d["Model"],
                    "size": f"{round(size,1)} GB"
                })

            return result

        # =========================
        # 🐧 LINUX
        # =========================
        elif system == "Linux":

            out = subprocess.check_output([
                "lsblk",
                "-J",
                "-o",
                "NAME,SIZE,MODEL,TRAN"
            ])

            data = json.loads(out)

            result = []

            for d in data["blockdevices"]:

                if d.get("tran") != "usb":
                    continue

                result.append({
                    "path": f"/dev/{d['name']}",
                    "model": d.get("model", "USB"),
                    "size": d.get("size", "?")
                })

            return result

        # =========================
        # 🍎 MACOS
        # =========================
        elif system == "Darwin":

            out = subprocess.check_output([
                "diskutil",
                "list",
                "-plist"
            ])

            return {"macos": True}

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


# =========================
# 🔍 DETECT BOOT MODE
# =========================
def detect_boot_mode(path):

    try:
        with open(path, "rb") as f:
            data = f.read(1024 * 1024)

        if b"EFI" in data:
            return "UEFI"

        return "BIOS"

    except:
        return "UNKNOWN"


# =========================
# 🔐 SHA256
# =========================
def sha256(path):

    h = hashlib.sha256()

    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(4 * 1024 * 1024), b""):
            h.update(chunk)

    return h.hexdigest()


# =========================
# 🔥 RAW FLASH
# =========================
def flash_iso(iso_path, device_path):

    CHUNK = 4 * 1024 * 1024

    total = os.path.getsize(iso_path)
    written = 0

    start = time.time()

    with open(iso_path, "rb") as src, open(device_path, "wb") as dst:

        while True:

            chunk = src.read(CHUNK)

            if not chunk:
                break

            dst.write(chunk)
            dst.flush()

            written += len(chunk)

            elapsed = time.time() - start

            speed = written / elapsed if elapsed > 0 else 0

            eta = (total - written) / speed if speed > 0 else 0

            yield {
                "progress": int((written / total) * 100),
                "speed": round(speed / 1024 / 1024, 2),
                "eta": int(eta),
                "written_gb": round(written / 10243, 2),
                "total_gb": round(total / 1024**3, 2)
            }

    yield {
        "progress": 100,
        "status": "done"
    }


# =========================
# 🚀 FLASH API
# =========================
@app.post("/flash")
def flash(data: FlashRequest):

    if not os.path.exists(data.iso):
        return {"error": "ISO not found"}

    def gen():

        try:

            boot = detect_boot_mode(data.iso)

            yield json.dumps({
                "type": "boot",
                "mode": boot
            }) + "\n"

            for p in flash_iso(data.iso, data.device):

                yield json.dumps({
                    "type": "progress",
                    "data": p
                }) + "\n"

        except Exception as e:

            traceback.print_exc()

            yield json.dumps({
                "type": "error",
                "message": str(e)
            }) + "\n"

    return StreamingResponse(
        gen(),
        media_type="application/x-ndjson"
    )


# =========================
# 🔐 VERIFY
# =========================
@app.post("/verify")
def verify(data: dict):

    try:

        iso_hash = sha256(data["iso"])
        dev_hash = sha256(data["device"])

        return {
            "match": iso_hash == dev_hash,
            "iso_hash": iso_hash,
            "device_hash": dev_hash
        }

    except Exception as e:
        return {"error": str(e)}


# =========================
# 🚀 RUN
# =========================
if name == "main":

    import uvicorn

    uvicorn.run(
        app,
        h
