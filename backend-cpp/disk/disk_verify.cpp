#include "disk_verify.h"

#include <windows.h>

bool verifyChunk(
    HANDLE h,
    BYTE* buf,
    DWORD size
)
{
    BYTE* verifyBuf =
        new BYTE[size];

    DWORD readBytes = 0;

    BOOL ok =
        ReadFile(
            h,
            verifyBuf,
            size,
            &readBytes,
            NULL
        );

    delete[] verifyBuf;

    return (
        ok &&
        readBytes == size
    );
}
