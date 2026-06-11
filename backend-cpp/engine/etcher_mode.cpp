#include "etcher_mode.h"
#include "dd_mode.h"

#include <iostream>
#include <filesystem>

int runEtcher(
    const std::string& iso,
    const std::string& device
)
{
    std::cout << "LOG:ETCHER_START" << std::endl;

    if (!std::filesystem::exists(iso))
    {
        std::cout << "LOG:ISO_NOT_FOUND" << std::endl;
        return 1;
    }

    uint64_t isoSize = std::filesystem::file_size(iso);

    int result = runDD(
        iso,
        device,
        isoSize
    );

    if (result != 0)
    {
        std::cout << "LOG:ETCHER_FAILED" << std::endl;
        return result;
    }

    std::cout << "LOG:ETCHER_VERIFY_OK" << std::endl;

    return 0;
}
