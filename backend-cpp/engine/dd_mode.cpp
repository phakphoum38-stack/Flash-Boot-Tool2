#include "dd_mode.h"

#include "../disk/disk_open.h"
#include "../disk/disk_write.h"
#include "progress.h"

#include <windows.h>
#include <fstream>
#include <iostream>

int runDD(
    const std::string& iso,
    const std::string& device
)
{
    std::cout
        << "LOG:DD_START"
        << std::endl;

    std::ifstream file(
        iso,
        std::ios::binary
    );

    if (!file)
    {
        std::cout
            << "LOG:ISO_OPEN_FAIL"
            << std::endl;

        return 1;
    }

    HANDLE disk =
        CreateFileA(
            device.c_str(),
            GENERIC_WRITE,
            FILE_SHARE_READ |
            FILE_SHARE_WRITE,
            NULL,
            OPEN_EXISTING,
            0,
            NULL
        );

    if (disk == INVALID_HANDLE_VALUE)
    {
        std::cout
            << "LOG:DISK_OPEN_FAIL"
            << std::endl;

        return 1;
    }

    const DWORD CHUNK =
        4 * 1024 * 1024;

    BYTE* buffer =
        new BYTE[CHUNK];

    unsigned long long total = 0;

    while (file)
    {
        file.read(
            (char*)buffer,
            CHUNK
        );

        DWORD bytes =
            (DWORD)file.gcount();

        if (bytes == 0)
            break;

        DWORD written = 0;

        if (!WriteFile(
            disk,
            buffer,
            bytes,
            &written,
            NULL
        ))
        {
            delete[] buffer;

            CloseHandle(disk);

            std::cout
                << "LOG:WRITE_FAIL"
                << std::endl;

            return 1;
        }

        total += written;

        emitProgress(
            total /
            (1024.0 * 1024.0)
        );
    }

    delete[] buffer;

    FlushFileBuffers(disk);

    CloseHandle(disk);

    std::cout
        << "LOG:DD_DONE"
        << std::endl;

    return 0;
}
