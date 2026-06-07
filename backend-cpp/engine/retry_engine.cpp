#include <windows.h>
#include <iostream>

bool writeDisk(HANDLE h, BYTE* buffer, DWORD size) {
    DWORD written = 0;

    return WriteFile(h, buffer, size, &written, NULL);
}

bool retryWrite(HANDLE h, BYTE* buffer, DWORD size) {
    for (int i = 0; i < 3; i++) {
        if (writeDisk(h, buffer, size))
            return true;

        Sleep(100 * (i + 1)); // backoff
    }

    return false;
}
