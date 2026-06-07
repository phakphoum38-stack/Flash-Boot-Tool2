#include <windows.h>

void lockDisk(HANDLE h) {
    DWORD bytes;

    DeviceIoControl(h, FSCTL_LOCK_VOLUME, NULL, 0, NULL, 0, &bytes, NULL);
    DeviceIoControl(h, FSCTL_DISMOUNT_VOLUME, NULL, 0, NULL, 0, &bytes, NULL);
}
