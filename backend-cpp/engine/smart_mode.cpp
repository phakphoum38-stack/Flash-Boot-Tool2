#include "smart_mode.h"
#include "dd_mode.h"

#include <iostream>
#include <filesystem>

int runSmart(
    const std::string& iso,
    const std::string& device
)
{
    std::cout << "LOG:SMART_START" << std::endl;

    uint64_t isoSize = std::filesystem::file_size(iso);

    int result = runDD(
        iso,
        device,
        isoSize
    );

    if (result != 0)
    {
        std::cout << "LOG:SMART_FAILED" << std::endl;
        return result;
    }

    std::cout << "LOG:VERIFY_OK" << std::endl;

    return 0;
}
