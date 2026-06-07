#include <windows.h>

bool writeRaw(HANDLE disk, void* data, size_t size) {

    DWORD written;

    return WriteFile(disk, data, (DWORD)size, &written, NULL);
}
