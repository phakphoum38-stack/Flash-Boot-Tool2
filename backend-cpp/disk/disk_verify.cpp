#include <windows.h>
#include <cstring>

bool verifySector(HANDLE h, BYTE* data, DWORD size) {
    BYTE* buf = new BYTE[size];
    DWORD read = 0;

    SetFilePointer(h, 0, NULL, FILE_BEGIN);
    ReadFile(h, buf, size, &read, NULL);

    bool ok = (memcmp(buf, data, size) == 0);

    delete[] buf;
    return ok;
}
