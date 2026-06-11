#include "disk_verify.h"

#include <windows.h>
#include <cstring>

bool verifyChunk(
    HANDLE h,
    BYTE* expected,
    DWORD size
)
{
    BYTE* actual =
        new BYTE[size];

    DWORD readBytes = 0;

    BOOL ok =
        ReadFile(
            h,
            actual,
            size,
            &readBytes,
            NULL
        );

    bool result =
        ok &&
        readBytes == size &&
        memcmp(
            expected,
            actual,
            size
        ) == 0;

    delete[] actual;

    return result;
}
