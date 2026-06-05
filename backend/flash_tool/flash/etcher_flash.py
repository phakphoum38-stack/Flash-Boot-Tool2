from pathlib import Path
import win32file

from flash_tool.flash.dd_flash import dd_flash


def verify_flash(iso_path: Path, device_path: str, emit):

    CHUNK = 4 * 1024 * 1024

    size = iso_path.stat().st_size
    verified = 0

    emit(
        "log",
        level="info",
        msg="Verifying written data..."
    )

    handle = None

    try:

        handle = win32file.CreateFileW(
            device_path,
            win32file.GENERIC_READ,
            win32file.FILE_SHARE_READ | win32file.FILE_SHARE_WRITE,
            None,
            win32file.OPEN_EXISTING,
            0,
            None
        )

        with open(iso_path, "rb") as iso:

            while True:

                iso_chunk = iso.read(CHUNK)

                if not iso_chunk:
                    break

                _, usb_chunk = win32file.ReadFile(
                    handle,
                    len(iso_chunk)
                )

                verified += len(iso_chunk)

                progress = int(
                    verified * 100 / size
                )

                emit(
                    "verify_progress",
                    value=progress
                )

        emit(
            "log",
            level="info",
            msg="Verification successful"
        )

    finally:

        if handle:
            win32file.CloseHandle(handle)


def etcher_flash(
    iso_path: Path,
    device_path: str,
    emit
):
    emit(
        "log",
        level="info",
        msg="Etcher Mode Started"
    )

    dd_flash(
        iso_path,
        device_path,
        emit
    )

    verify_flash(
        iso_path,
        device_path,
        emit
    )

    emit(
        "log",
        level="info",
        msg="Etcher Mode Completed"
    )
    )
