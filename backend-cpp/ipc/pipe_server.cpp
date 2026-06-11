#include "pipe_server.h"

#include <iostream>

void sendPipeMessage(
    const char* msg
)
{
    std::cout
        << msg
        << std::endl;
}
