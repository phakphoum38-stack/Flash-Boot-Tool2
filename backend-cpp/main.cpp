#include <iostream>
#include "engine/flash_engine_v4.cpp"
#include "ipc/pipe_server.cpp"

int main(int argc, char** argv) {

    if (argc < 4) {
        std::cout << "ERROR: usage <mode> <iso> <device>\n";
        return 1;
    }

    std::string mode = argv[1];
    std::string iso = argv[2];
    std::string device = argv[3];

    PipeServer::init(); // start IPC listener

    FlashEngineV4 engine;
    return engine.start(mode, iso, device);
}
