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

    int result =
        runDD(
            iso,
            device
        );

    if (result != 0)
    {
        std::cout
            << "LOG:ETCHER_FAILED"
            << std::endl;

        return result;
    }

    std::cout
        << "LOG:ETCHER_VERIFY_OK"
        << std::endl;

    return 0;
}
