#include <windows.h>
#include <iostream>

void sendPipe(const std::string& msg) {
    HANDLE pipe = CreateFileA(
        R"(\\.\pipe\flash_engine)",
        GENERIC_WRITE,
        0,
        NULL,
        OPEN_EXISTING,
        0,
        NULL
    );

    if (pipe == INVALID_HANDLE_VALUE) return;

    DWORD written;
    WriteFile(pipe, msg.c_str(), msg.size(), &written, NULL);

    CloseHandle(pipe);
}
