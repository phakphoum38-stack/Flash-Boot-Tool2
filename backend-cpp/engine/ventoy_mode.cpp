#include "ventoy_mode.h"

#include <cstdlib>
#include <iostream>

int runVentoy(
    const std::string& iso,
    const std::string& device
)
{
    std::cout
        << "LOG:VENTOY_START"
        << std::endl;

    std::string cmd =
        "resources\\ventoy\\Ventoy2Disk_X64.exe";

    system(
        cmd.c_str()
    );

    return 0;
}
