#include <windows.h>
#include <string>

class PipeServer {

public:

    static void send(const std::string& msg) {

        HANDLE pipe = CreateFileA(
            R"(\\.\pipe\flash_tool)",
            GENERIC_WRITE,
            0, NULL,
            OPEN_EXISTING,
            0, NULL
        );

        if (pipe == INVALID_HANDLE_VALUE)
            return;

        DWORD written;
        WriteFile(pipe, msg.c_str(), msg.size(), &written, NULL);

        CloseHandle(pipe);
    }
};
