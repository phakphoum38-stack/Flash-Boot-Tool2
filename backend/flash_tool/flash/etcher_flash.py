from pathlib import Path
import win32file

from flash_tool.flash.dd_flash import dd_flash


def verify_flash(iso_path: Path, device_path: str, emit):
    if (line.startsWith("VERIFY:")) {
    setVerifyProgress(
        Number(line.replace("VERIFY:", ""))
    )
}


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

    # ขั้นตอนที่ 1
    dd_flash(
        iso_path,
        device_path,
        emit
    )

    # ขั้นตอนที่ 2
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
