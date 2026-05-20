import win32file

CHUNK = 4 * 1024 * 1024

def dd_flash(iso_path, device_path, emit):
    emit("log", level="info", msg=f"Starting Etcher mode: {iso_path.name}")
    
    size = iso_path.stat().st_size
    written = 0
    
    with open(iso_path, 'rb') as f:
        handle = win32file.CreateFileW(
            device_path,
            win32file.GENERIC_WRITE,
            0, None,
            win32file.OPEN_EXISTING,
            win32file.FILE_FLAG_NO_BUFFERING,
            None
        )
        
        while chunk := f.read(CHUNK):
            win32file.WriteFile(handle, chunk)
            written += len(chunk)
            progress = int(written * 100 / size)
            emit("progress", value=progress, written=written, total=size)
        
        win32file.CloseHandle(handle)
    
    emit("log", level="info", msg="Write completed")
