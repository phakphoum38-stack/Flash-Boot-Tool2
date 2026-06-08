#include <windows.h>
#include <iostream>

void pipeServer() {
    HANDLE pipe = CreateNamedPipeA(
        "\\\\.\\pipe\\flash_pipe",
        PIPE_ACCESS_OUTBOUND,
        PIPE_TYPE_MESSAGE | PIPE_READMODE_MESSAGE | PIPE_WAIT,
        1, 65536, 65536, 0, NULL
    );

    ConnectNamedPipe(pipe, NULL);

    std::cout << "PIPE READY\n";
}
