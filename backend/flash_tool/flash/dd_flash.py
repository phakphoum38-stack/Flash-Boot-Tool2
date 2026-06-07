from flash_tool.flash.rufus_v3 import rufus_v3_flash

def dd_flash(image_path, device, emit=None):
    try:
        return rufus_v3_flash(image_path, device, emit)
    except Exception as e:
        if emit:
            emit("error", msg=str(e))
