#include "retry_engine.h"

#include <windows.h>

bool retryWrite(
    HANDLE h,
    BYTE* data,
    DWORD size
)
{
    int retries = 5;

    while (retries--) {

        DWORD written = 0;

        BOOL ok = WriteFile(
            h,
            data,
            size,
            &written,
            NULL
        );

        if (ok && written == size) {
            return true;
        }

        Sleep(50);
    }

    return false;
}
