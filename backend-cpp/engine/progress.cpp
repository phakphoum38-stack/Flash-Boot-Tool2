#include "progress.h"

#include <iostream>

void emitProgress(
    double percent
)
{
    std::cout
        << "PROGRESS:"
        << percent
        << std::endl;
}

void emitSpeed(
    double mbps
)
{
    std::cout
        << "SPEED:"
        << mbps
        << std::endl;
}

void emitLog(
    const char* msg
)
{
    std::cout
        << "LOG:"
        << msg
        << std::endl;
}
