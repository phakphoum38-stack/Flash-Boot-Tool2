#include <windows.h>

bool retryWrite(HANDLE disk, char* data, size_t size) {

    DWORD written;

    for (int i = 0; i < 3; i++) {

        if (WriteFile(disk, data, (DWORD)size, &written, NULL))
            return true;

        DWORD err = GetLastError();

        if (err == ERROR_IO_DEVICE ||
            err == ERROR_NOT_READY) {

            Sleep(50);
            continue;
        }

        return false;
    }

    return false;
}
