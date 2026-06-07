#include <windows.h>
#include <cstring>

bool verifyBuffer(HANDLE h, BYTE* original, DWORD size) {
    BYTE* buf = new BYTE[size];
    DWORD read = 0;

    ReadFile(h, buf, size, &read, NULL);

    bool ok = (memcmp(buf, original, size) == 0);

    delete[] buf;
    return ok;
}
