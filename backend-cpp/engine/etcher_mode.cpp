#include "etcher_mode.h"

#include "dd_mode.h"

#include <iostream>

int runEtcher(
    const std::string& iso,
    const std::string& device
)
{
    std::cout
        << "LOG:ETCHER_START"
        << std::endl;

    return runDD(
        iso,
        device
    );
}
