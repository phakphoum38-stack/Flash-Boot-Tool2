#include "flash_engine_v4.h"
#include "progress.h"

#include <windows.h>

int FlashEngineV4::run(
    std::string mode,
    std::string iso,
    std::string device
)
{
    emitLog(
        "FlashEngineV4 started"
    );

    for (
        int i = 0;
        i <= 100;
        i += 5
    )
    {
        emitProgress(i);

        emitSpeed(
            20.0 +
            (i * 0.8)
        );

        Sleep(200);
    }

    for (
        int i = 0;
        i <= 100;
        i += 10
    )
    {
        emitVerify(i);

        Sleep(150);
    }

    emitDone();

    return 0;
}
