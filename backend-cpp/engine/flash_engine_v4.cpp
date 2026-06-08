#include "flash_engine_v4.h"

#include <iostream>
#include <string>

int FlashEngineV4::run(
    std::string mode,
    std::string iso,
    std::string device
)
{
    std::cout << "FlashEngineV4 started" << std::endl;
    std::cout << "Mode   : " << mode << std::endl;
    std::cout << "ISO    : " << iso << std::endl;
    std::cout << "Device : " << device << std::endl;

    return 0;
}
