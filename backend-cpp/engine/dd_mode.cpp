#include "dd_mode.h"

#include "../disk/disk_open.h"
#include "../disk/disk_write.h"
#include "progress.h"

#include <windows.h>
#include <fstream>
#include <iostream>

int runDD(
    const std::string& iso,
    const std::string& device,
    uint64_t isoSize
)
{
    std::cout
        << "LOG:DD_START"
        << std::endl;

    std::cout
        << "LOG:DEVICE="
        << device
        << std::endl;

    std::cout
        << "LOG:ISO="
        << iso
        << std::endl;

    if (isoSize == 0)
    {
        std::cout
            << "LOG:INVALID_ISO_SIZE"
            << std::endl;

        return 1;
    }

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
        DWORD err =
            GetLastError();

        std::cout
            << "LOG:DISK_OPEN_FAIL:"
            << err
            << std::endl;

        return 1;
    }

    std::cout
        << "LOG:DISK_OPEN_OK"
        << std::endl;

    const DWORD CHUNK =
        4 * 1024 * 1024;

    BYTE* buffer =
        new BYTE[CHUNK];

    unsigned long long total = 0;

    while (true)
    {
        file.read(
            reinterpret_cast<char*>(buffer),
            CHUNK
        );

        std::streamsize bytesRead =
            file.gcount();

        if (bytesRead <= 0)
            break;

        DWORD written = 0;

        if (!WriteFile(
            disk,
            buffer,
            static_cast<DWORD>(bytesRead),
            &written,
            NULL
        ))
        {
            DWORD err =
                GetLastError();

            delete[] buffer;

            CloseHandle(disk);

            std::cout
                << "LOG:WRITE_FAIL:"
                << err
                << std::endl;

            return 1;
        }

        total += written;

        double percent =
            (
                static_cast<double>(total)
                * 100.0
            ) /
            static_cast<double>(
                isoSize
            );

        emitProgress(
            percent
        );
    }

    delete[] buffer;

    FlushFileBuffers(
        disk
    );

    CloseHandle(
        disk
    );

    std::cout
        << "LOG:DD_DONE"
        << std::endl;

    return 0;
}
