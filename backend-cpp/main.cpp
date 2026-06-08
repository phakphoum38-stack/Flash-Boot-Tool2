#include <iostream>
#include <string>

#include "engine/flash_engine_v4.h"

int main(int argc, char** argv)
{
    if (argc < 4) {
        std::cout
            << "USAGE: flash.exe <mode> <iso> <device>\n";
        return 1;
    }

    std::string mode   = argv[1];
    std::string iso    = argv[2];
    std::string device = argv[3];

    FlashEngineV4 engine;

    return engine.run(
        mode,
        iso,
        device
    );
}
