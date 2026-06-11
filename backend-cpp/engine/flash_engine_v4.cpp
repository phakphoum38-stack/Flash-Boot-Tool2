#include "flash_engine_v4.h"

#include "dd_mode.h"
#include "smart_mode.h"
#include "etcher_mode.h"
#include "ventoy_mode.h"

#include <iostream>

int FlashEngineV4::run(
    std::string mode,
    std::string iso,
    std::string device
)
{
    std::cout
        << "FlashEngineV4 started"
        << std::endl;

    std::cout
        << "Mode : "
        << mode
        << std::endl;

    if (mode == "dd")
        return runDD(
            iso,
            device
        );

    if (mode == "smart")
        return runSmart(
            iso,
            device
        );

    if (mode == "etcher")
        return runEtcher(
            iso,
            device
        );

    if (mode == "ventoy")
        return runVentoy(
            iso,
            device
        );

    return 1;
}
