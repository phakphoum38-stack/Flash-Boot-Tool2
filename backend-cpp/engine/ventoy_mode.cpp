#include "ventoy_mode.h"

#include <cstdlib>
#include <iostream>
#include <filesystem>

int runVentoy(
    const std::string& iso,
    const std::string& device
)
{
    std::cout << "LOG:VENTOY_START" << std::endl;

    std::string ventoyExe =
        "resources\\ventoy\\Ventoy2Disk_X64.exe";

    if (!std::filesystem::exists(ventoyExe))
    {
        std::cout << "LOG:VENTOY_NOT_FOUND" << std::endl;
        return 1;
    }

    // NOTE: Ventoy normally writes whole disk, not ISO directly
    std::string cmd =
        "\"" + ventoyExe + "\"";

    int result = system(cmd.c_str());

    if (result != 0)
    {
        std::cout << "LOG:VENTOY_FAILED" << std::endl;
        return result;
    }

    std::cout << "LOG:VENTOY_DONE" << std::endl;

    return 0;
}
