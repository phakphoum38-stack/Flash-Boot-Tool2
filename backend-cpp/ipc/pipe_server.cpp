#include "pipe_server.h"

#include <iostream>

void sendIPC(
    const char* msg
)
{
    std::cout
        << "IPC:"
        << msg
        << std::endl;
}
