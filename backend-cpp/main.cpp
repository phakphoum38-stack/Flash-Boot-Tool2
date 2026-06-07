#include <iostream>
#include "engine/flash_engine.h"

int main(int argc, char* argv[]) {
    if (argc < 4) {
        std::cout << "ERROR: usage <mode> <iso> <PhysicalDriveX>\n";
        return 1;
    }

    std::string mode = argv[1];
    std::string iso = argv[2];
    std::string device = argv[3];

    FlashEngine engine;
    int result = engine.start(mode, iso, device);

    return result;
}
