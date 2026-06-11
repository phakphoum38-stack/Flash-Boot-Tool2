#include "disk_write.h"

#include "../engine/retry_engine.h"
#include "../engine/progress.h"

#include <iostream>

bool writeChunk(
    HANDLE h,
    BYTE* buf,
    DWORD size,
    unsigned long long& total
)
{
    if (
        !retryWrite(
            h,
            buf,
            size
        )
    )
    {
        emitLog(
            "WRITE_FAIL"
        );

        return false;
    }

    total += size;

    emitProgress(
        total /
        (1024.0 * 1024.0)
    );

    return true;
}
