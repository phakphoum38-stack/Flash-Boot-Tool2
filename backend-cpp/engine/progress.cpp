#include "progress.h"

#include <iostream>

void emitLog(
    const char* msg
)
{
    std::cout
        << "LOG:"
        << msg
        << std::endl;
}

void emitProgress(
    double percent
)
{
    std::cout
        << "PROGRESS:"
        << percent
        << std::endl;
}

void emitVerify(
    double percent
)
{
    std::cout
        << "VERIFY:"
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

void emitDone()
{
    std::cout
        << "DONE:"
        << std::endl;
}

void emitFailed()
{
    std::cout
        << "FAILED:"
        << std::endl;
}
