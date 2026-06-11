#include "retry_engine.h"

#include <windows.h>

bool retryWrite(
    HANDLE h,
    BYTE* buf,
    DWORD size
)
{
    DWORD written = 0;

    for (
        int retry = 0;
        retry < 3;
        retry++
    )
    {
        if (
            WriteFile(
                h,
                buf,
                size,
                &written,
                NULL
            )
        )
        {
            return true;
        }

        Sleep(500);
    }

    return false;
}
