#include <windows.h>

bool writeDisk(HANDLE h, BYTE* buffer, DWORD size) {
    DWORD written = 0;

    return WriteFile(
        h,
        buffer,
        size,
        &written,
        NULL
    );
}
