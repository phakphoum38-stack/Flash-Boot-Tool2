import sys
import json
import argparse
from pathlib import Path
from flash_tool.flash.dd_flash import dd_flash
from flash_tool.flash.smart_flash import smart_flash
from flash_tool.flash.ventoy_mode import ventoy_flash

def emit(event_type, **kwargs):
    print(json.dumps({"type": event_type, **kwargs}), flush=True)

def main():
    parser = argparse.ArgumentParser(prog="flash_tool")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # flash command
    p = subparsers.add_parser("flash")
    p.add_argument("mode", choices=["etcher", "smart", "ventoy"])
    p.add_argument("iso", type=Path)
    p.add_argument("device")
    args = parser.parse_args()

    try:
        if args.command == "flash":
            if args.mode == "etcher":
                dd_flash(args.iso, args.device, emit)
            elif args.mode == "smart":
                smart_flash(args.iso, args.device, emit)
            elif args.mode == "ventoy":
                ventoy_flash(args.iso, args.device, emit)
        
        # ลบบรรทัดนี้ออก เพราะแต่ละ mode ยิง result เองแล้ว
        # emit("result", success=True, msg="Flash completed")
        
    except Exception as e:
        emit("error", msg=str(e))
        sys.exit(1)

if __name__ == "__main__":
    main()
