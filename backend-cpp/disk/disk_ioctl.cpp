#include <windows.h>

void unlockDisk(HANDLE h) {
    DWORD b;
    DeviceIoControl(h, FSCTL_UNLOCK_VOLUME, NULL, 0, NULL, 0, &b, NULL);
}
