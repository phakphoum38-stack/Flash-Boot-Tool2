#include "retry_engine.h"

#include <windows.h>

bool retryWrite(
    HANDLE h,
    BYTE* buf,
    DWORD size,
    int maxRetry
)
{
    for (
        int i = 0;
        i < maxRetry;
        i++
    )
    {
        DWORD written = 0;

        BOOL ok =
            WriteFile(
                h,
                buf,
                size,
                &written,
                NULL
            );

        if (
            ok &&
            written == size
        )
        {
            return true;
        }

        Sleep(500);
    }

    return false;
}
