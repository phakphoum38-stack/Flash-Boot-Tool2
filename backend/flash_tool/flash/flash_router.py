from flash_tool.flash.dd_flash import dd_flash
from flash_tool.flash.smart_flash import smart_flash
from flash_tool.flash.ventoy_mode import ventoy_flash
from flash_tool.flash.etcher_flash import etcher_flash
from flash_tool.flash.rufus_v3 import rufus_v3_flash


def flash_router(mode, image, device, cb=None):

    # 🔥 NEW DEFAULT ENGINE (RUFUS V3)
    if mode == "dd":
        return rufus_v3_flash(image, device, cb)

    if mode == "smart":
        return rufus_v3_flash(image, device, cb)

    if mode == "etcher":
        return rufus_v3_flash(image, device, cb)

    if mode == "ventoy":
        return ventoy_flash(image, device, cb)

    return rufus_v3_flash(image, device, cb)
