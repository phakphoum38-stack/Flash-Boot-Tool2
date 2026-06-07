#include <windows.h>

bool retryWrite(HANDLE disk, BYTE* data, DWORD size) {

    DWORD written = 0;

    for (int i = 0; i < 3; i++) {

        if (WriteFile(disk, data, size, &written, NULL))
            return true;

        DWORD err = GetLastError();

        // transient USB errors only
        if (err == ERROR_IO_DEVICE ||
            err == ERROR_NOT_READY ||
            err == ERROR_INVALID_PARAMETER) {

            Sleep(50);
            continue;
        }

        return false;
    }

    return false;
}
