#include "flash_engine_v4.h"

#include <iostream>
#include <string>

int FlashEngineV4::run(
    std::string mode,
    std::string iso,
    std::string device
)
{
    std::cout << "MODE   : " << mode << std::endl;
    std::cout << "ISO    : " << iso << std::endl;
    std::cout << "DEVICE : " << device << std::endl;

    return 0;
}
