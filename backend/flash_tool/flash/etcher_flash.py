from flash_tool.flash.rufus_v3 import rufus_v3_flash

def etcher_flash(image_path, device, emit=None):
    return rufus_v3_flash(image_path, device, emit)
