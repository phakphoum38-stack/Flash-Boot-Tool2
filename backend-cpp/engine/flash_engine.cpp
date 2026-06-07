#include <iostream>
#include <fstream>
#include <windows.h>

#include "../disk/disk_open.cpp"
#include "../disk/disk_ioctl.cpp"
#include "../disk/disk_verify.cpp"
#include "../engine/retry_engine.cpp"
#include "../engine/progress.cpp"
#include "../engine/state.h"
#include "../engine/state_manager.cpp"

class FlashEngine {
public:
    int start(std::string mode, std::string iso, std::string device) {

        int index = extractIndex(device);

        HANDLE disk = openDisk(index);
        if (disk == INVALID_HANDLE_VALUE) {
            std::cout << "ERROR: cannot open disk\n";
            return 1;
        }

        lockDisk(disk);

        // =========================
        // RESUME SYSTEM
        // =========================
        FlashState state;
        loadState(state);

        size_t offset = state.offset;

        std::ifstream file(iso, std::ios::binary);
        file.seekg(offset);

        const int CHUNK = 4 * 1024 * 1024;
        char* buffer = new char[CHUNK];

        size_t total = offset;

        // =========================
        // MAIN LOOP
        // =========================
        while (file.read(buffer, CHUNK) || file.gcount() > 0) {

            DWORD size = file.gcount();

            if (size == 0) break;

            if (!retryWrite(disk, (BYTE*)buffer, size)) {
                std::cout << "ERROR: write failed\n";
                cleanup(disk, buffer);
                return 1;
            }

            // =========================
            // VERIFY (RUFUS STYLE)
            // =========================
            if (!verifyBuffer(disk, (BYTE*)buffer, size)) {
                std::cout << "VERIFY_FAIL\n";
            }

            total += size;

            // =========================
            // SAVE STATE
            // =========================
            state.offset = total;
            state.iso = iso;
            state.device = device;
            saveState(state);

            emitProgress(total / (1024.0 * 1024.0));
        }

        // =========================
        // FINISH
        // =========================
        FlushFileBuffers(disk);

        state.done = true;
        saveState(state);

        cleanup(disk, buffer);

        std::cout << "DONE\n";
        return 0;
    }

private:

    void cleanup(HANDLE disk, char* buffer) {
        if (disk != INVALID_HANDLE_VALUE)
            CloseHandle(disk);

        delete[] buffer;
    }

    int extractIndex(std::string dev) {
        size_t pos = dev.find("PhysicalDrive");
        return std::stoi(dev.substr(pos + 13));
    }
};
