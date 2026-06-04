import sys
from pathlib import Path

from flash_tool.flash.dd_flash import dd_flash
from flash_tool.flash.smart_flash import smart_flash

try:
   from flash_tool.flash.ventoy_mode import ventoy_flash
except Exception:
   ventoy_flash = None

try:
   from flash_tool.flash.etcher_flash import etcher_flash
except Exception:
   etcher_flash = None

def emit(event_type, **kwargs):

  if event_type == "progress":

    value = kwargs.get("value", 0)

    print(
        f"PROGRESS:{value}",
        flush=True
    )

elif event_type == "log":

    msg = kwargs.get(
        "msg",
        ""
    )

    print(
        f"LOG:{msg}",
        flush=True
    )

elif event_type == "error":

    msg = kwargs.get(
        "msg",
        "Unknown Error"
    )

    print(
        msg,
        file=sys.stderr,
        flush=True
    )

def main():

if len(sys.argv) < 4:

    emit(
        "error",
        msg="Usage: backend.exe <mode> <iso> <device>"
    )

    sys.exit(1)

mode = sys.argv[1].lower().strip()

iso_path = Path(sys.argv[2])

device = sys.argv[3]

emit(
    "log",
    msg=f"Mode = {mode}"
)

emit(
    "log",
    msg=f"ISO = {iso_path}"
)

emit(
    "log",
    msg=f"USB = {device}"
)

try:

    if mode == "dd":

        dd_flash(
            iso_path,
            device,
            emit
        )

    elif mode == "smart":

        smart_flash(
            iso_path,
            device,
            emit
        )

    elif mode == "ventoy":

        if ventoy_flash is None:

            raise Exception(
                "ventoy_mode.py not found"
            )

        ventoy_flash(
            iso_path,
            device,
            emit
        )

    elif mode == "etcher":

        if etcher_flash is None:

            raise Exception(
                "etcher_flash.py not found"
            )

        etcher_flash(
            iso_path,
            device,
            emit
        )

    else:

        raise Exception(
            f"Unknown Mode: {mode}"
        )

    emit(
        "log",
        msg="Flash Complete"
    )

    sys.exit(0)

except Exception as e:

    emit(
        "error",
        msg=str(e)
    )

    sys.exit(1)

if **name** == "**main**":
main()
