from .dd_flash import dd_flash

def etcher_flash(
iso_path,
device,
emit
):

```
emit(
    "log",
    msg="Etcher Mode Started"
)

dd_flash(
    iso_path,
    device,
    emit
)

emit(
    "log",
    msg="Verification Complete"
)
```
