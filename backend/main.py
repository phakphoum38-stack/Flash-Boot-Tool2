from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os, json, time, hashlib, subprocess, traceback, platform

app = FastAPI(title="Flash Boot Tool PRO")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class FlashRequest(BaseModel):
    iso: str
    device: str
    confirm: bool = False

def is_admin():
    try:
        return os.geteuid() == 0
    except AttributeError:
        import ctypes
        return ctypes.windll.shell32.IsUserAnAdmin()!= 0

@app.get("/")
def root():
    return {"status": "ok", "app": "Flash Boot Tool PRO"}

@app.get("/devices")
def devices():
    system = platform.system()
    try:
        if system == "Windows":
            cmd = [
                "powershell", "-Command",
                """Get-CimInstance Win32_DiskDrive | Where-Object {$_.InterfaceType -eq 'USB'} | Select DeviceID,Model,Size | ConvertTo-Json"""
            ]
            out = subprocess.check_output(cmd, text=True)
            data = json.loads(out)
            if isinstance(data, dict):
                data = [data]
            result = []
            for d in data:
                size_gb = int(d["Size"]) / (1024**3)
                result.append({
                    "path": d["DeviceID"],
                    "model": d["Model"],
                    "size": f"{round(size_gb,1)} GB"
                })
            return result

        elif system == "Linux":
            out = subprocess.check_output(
                ["lsblk", "-J", "-o", "NAME,SIZE,MODEL,TRAN"], text=True
            )
            data = json.loads(out)
            result = []
            for d in data["blockdevices"]:
                if d.get("tran")!= "usb":
                    continue
                result.append({
                    "path": f"/dev/{d['name']}",
                    "model": d.get("model", "USB"),
                    "size": d.get("size", "?")
                })
            return result

        elif system == "Darwin":
            out = subprocess.check_output(["diskutil", "list", "-plist"], text=True)
            # แปลง plist เป็น dict แบบง่ายๆ
            import plistlib
            plist = plistlib.loads(out.encode())
            result = []
            for disk in plist.get("AllDisksAndPartitions", []):
                if "USB" in disk.get("DeviceIdentifier", "") or "USB" in disk.get("Content", ""):
                    result.append({
                        "path": f"/dev/{disk['DeviceIdentifier']}",
                        "model": disk.get("DeviceName", "USB"),
                        "size": disk.get("Size", "?")
                    })
            return result

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

def detect_boot_mode(path):
    try:
        with open(path, "rb") as f:
            data = f.read(1024 * 1024)
            if b"EFI" in data:
                return "UEFI"
            return "BIOS"
    except:
        return "UNKNOWN"

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(4 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

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
                "written_gb": round(written / 1024**3, 2),
                "total_gb": round(total / 1024**3, 2)
            }
    yield {"progress": 100, "status": "done"}

@app.post("/flash")
def flash(data: FlashRequest):
    if not data.confirm:
        raise HTTPException(status_code=400, detail="Set confirm=true to proceed. This will ERASE the device.")
    if not os.path.exists(data.iso):
        raise HTTPException(status_code=404, detail="ISO not found")
    if not is_admin():
        raise HTTPException(status_code=403, detail="Run as Administrator/Root to write to device")

    def gen():
        try:
            boot = detect_boot_mode(data.iso)
            yield json.dumps({"type": "boot", "mode": boot}) + "\n"
            for p in flash_iso(data.iso, data.device):
                yield json.dumps({"type": "progress", "data": p}) + "\n"
        except Exception as e:
            traceback.print_exc()
            yield json.dumps({"type": "error", "message": str(e)}) + "\n"

    return StreamingResponse(gen(), media_type="application/x-ndjson")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
