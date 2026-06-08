#include "disk_open.h"

#include <windows.h>
#include <string>

HANDLE openDisk(int index)
{
    std::string path =
        "\\\\.\\PhysicalDrive" +
        std::to_string(index);

    return CreateFileA(
        path.c_str(),
        GENERIC_READ | GENERIC_WRITE,
        FILE_SHARE_READ | FILE_SHARE_WRITE,
        NULL,
        OPEN_EXISTING,
        0,
        NULL
    );
}
