from .dd_flash import dd_flash
from .etcher_flash import etcher_flash
from .smart_flash import smart_flash
from .ventoy_mode import ventoy_mode


def flash_router(mode, image, drive, cb=None):
    mode = mode.lower().strip()

    if mode == "dd":
        return dd_flash(image, drive, cb)

    elif mode == "etcher":
        return etcher_flash(image, drive, cb)

    elif mode == "smart":
        return smart_flash(image, drive, cb)

    elif mode == "ventoy":
        return ventoy_mode(image, drive, cb)

    else:
        raise ValueError(f"Unknown flash mode: {mode}")
