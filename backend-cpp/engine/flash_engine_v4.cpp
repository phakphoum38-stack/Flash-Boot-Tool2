#include "flash_engine_v4.h"
#include "progress.h"
#include "state_manager.h"

#include <windows.h>

int FlashEngineV4::run(
    std::string mode,
    std::string iso,
    std::string device
)
{
    setState(WRITING);

    emitLog("FlashEngineV4 started");

    emitLog(
        ("Mode : " + mode).c_str()
    );

    emitLog(
        ("ISO : " + iso).c_str()
    );

    emitLog(
        ("Device : " + device).c_str()
    );

    for (
        int p = 0;
        p <= 100;
        p += 5
    )
    {
        emitProgress(p);

        emitSpeed(
            25.0 +
            (p * 0.5)
        );

        Sleep(200);
    }

    setState(
        VERIFYING
    );

    for (
        int p = 0;
        p <= 100;
        p += 10
    )
    {
        emitVerify(p);

        Sleep(150);
    }

    setState(
        DONE
    );

    emitDone();

    return 0;
}
