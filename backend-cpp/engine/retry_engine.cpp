#include <windows.h>

bool retryWrite(HANDLE disk, BYTE* data, DWORD size) {

    DWORD written = 0;
    int attempts = 0;

    while (attempts < 5) {

        if (WriteFile(disk, data, size, &written, NULL)) {
            return true;
        }

        DWORD err = GetLastError();

        // 🔥 ignore transient USB errors
        if (err == ERROR_INVALID_PARAMETER ||
            err == ERROR_IO_DEVICE ||
            err == ERROR_NOT_READY) {

            Sleep(30);
            attempts++;
            continue;
        }

        return false;
    }

    return false;
}
