#include "dd_mode.h"

#include <iostream>

int runDD(
    const std::string& iso,
    const std::string& device
)
{
    std::cout
        << "DD MODE"
        << std::endl;

    std::cout
        << "ISO : "
        << iso
        << std::endl;

    std::cout
        << "DEVICE : "
        << device
        << std::endl;

    return 0;
}
