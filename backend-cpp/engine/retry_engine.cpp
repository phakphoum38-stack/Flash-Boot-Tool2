#include <windows.h>
#include "../disk/disk_write.cpp"

bool retryWrite(HANDLE h, BYTE* buffer, DWORD size) {
    for (int i = 0; i < 3; i++) {
        if (writeDisk(h, buffer, size))
            return true;

        Sleep(100);
    }

    return false;
}
