#include <windows.h>

HANDLE openDisk(int index) {

    std::string path = "\\\\.\\PhysicalDrive" + std::to_string(index);

    HANDLE h = CreateFileA(
        path.c_str(),
        GENERIC_READ | GENERIC_WRITE,
        FILE_SHARE_READ | FILE_SHARE_WRITE,
        NULL,
        OPEN_EXISTING,
        0,
        NULL
    );

    return h;
}

void lockDisk(HANDLE h) {
    DWORD bytes;
    DeviceIoControl(h, FSCTL_LOCK_VOLUME, NULL, 0, NULL, 0, &bytes, NULL);
}
