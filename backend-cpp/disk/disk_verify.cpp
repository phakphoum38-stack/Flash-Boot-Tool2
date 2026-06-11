#include "disk_verify.h"

#include <windows.h>

bool verifyChunk(
    HANDLE h,
    BYTE* buf,
    DWORD size
)
{
    BYTE* verify =
        new BYTE[size];

    DWORD read = 0;

    bool ok =
        ReadFile(
            h,
            verify,
            size,
            &read,
            NULL
        );

    delete[] verify;

    return ok;
}
