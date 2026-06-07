#pragma once

#include <windows.h>
#include <iostream>
#include <fstream>
#include <vector>

#include "../disk/disk_open.cpp"
#include "../disk/disk_ioctl.cpp"
#include "../engine/retry_engine.cpp"
#include "../engine/progress.cpp"
#include "../engine/state_manager.cpp"
#include "../ipc/pipe_server.cpp"

class FlashEngineV4 {

public:

    int start(const std::string& mode,
              const std::string& iso,
              const std::string& device) {

        int index = extract(device);

        HANDLE disk = openDisk(index);
        if (disk == INVALID_HANDLE_VALUE) {
            PipeServer::send("ERROR:disk open failed");
            return 1;
        }

        lockDisk(disk);

        std::ifstream file(iso, std::ios::binary);
        if (!file.is_open()) {
            PipeServer::send("ERROR:iso open failed");
            return 1;
        }

        file.seekg(0, std::ios::end);
        size_t total = file.tellg();
        file.seekg(0);

        const size_t CHUNK = 8 * 1024 * 1024;
        std::vector<char> buffer(CHUNK);

        size_t written = 0;

        StateManager state(device);

        while (file) {

            file.read(buffer.data(), CHUNK);
            size_t size = file.gcount();

            if (size == 0) break;

            long long offset = state.offset();

            if (!retryWrite(disk, buffer.data(), size)) {

                PipeServer::send("LOG:write retry fail");
                state.markBad(offset);

                continue;
            }

            state.markDone(offset);

            written += size;

            progress((written * 100.0) / total);
        }

        PipeServer::send("DONE");
        return 0;
    }

private:

    int extract(std::string d) {
        return std::stoi(d.substr(d.find("PhysicalDrive") + 13));
    }
};
