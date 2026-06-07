#include <windows.h>
#include <string>

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
