from flash_tool.flash.dd_flash import dd_flash
from flash_tool.flash.smart_flash import smart_flash
from flash_tool.flash.ventoy_mode import ventoy_flash
from flash_tool.flash.etcher_flash import etcher_flash


def flash_router(mode, image, device, emit=None):
    mode = mode.lower()

    if mode == "dd":
        return dd_flash(image, device, emit)

    if mode == "smart":
        return smart_flash(image, device, emit)

    if mode == "ventoy":
        return ventoy_flash(image, device, emit)

    if mode == "etcher":
        return etcher_flash(image, device, emit)

    raise Exception(f"Unknown mode: {mode}")
