#include <windows.h>

bool lockDisk(HANDLE h) {
    DWORD bytes;
    return DeviceIoControl(
        h,
        FSCTL_LOCK_VOLUME,
        NULL, 0,
        NULL, 0,
        &bytes,
        NULL
    );
}

bool unlockDisk(HANDLE h) {
    DWORD bytes;
    return DeviceIoControl(
        h,
        FSCTL_UNLOCK_VOLUME,
        NULL, 0,
        NULL, 0,
        &bytes,
        NULL
    );
}
