#include <iostream>
#include <fstream>
#include "disk_open.cpp"
#include "disk_ioctl.cpp"
#include "disk_write.cpp"
#include "state_manager.cpp"

class FlashEngineV4 {
public:

    int run(std::string iso, std::string device) {

        FlashState state;
        loadState(state);

        int index = extractIndex(device);
        HANDLE disk = openDisk(index);

        if (disk == INVALID_HANDLE_VALUE) {
            std::cout << "ERROR: disk open failed\n";
            return 1;
        }

        lockDisk(disk);

        std::ifstream file(iso, std::ios::binary);

        const int CHUNK = 4 * 1024 * 1024;
        BYTE* buffer = new BYTE[CHUNK];

        file.seekg(state.offset);

        unsigned long long total = state.offset;

        while (file.read((char*)buffer, CHUNK) || file.gcount() > 0) {

            DWORD size = file.gcount();

            if (!writeChunk(disk, buffer, size, total)) {
                std::cout << "ERROR: write fail\n";
                state.offset = total;
                saveState(state);
                return 1;
            }

            state.offset = total;
            saveState(state);
        }

        delete[] buffer;

        unlockDisk(disk);
        clearState();

        std::cout << "DONE\n";
        return 0;
    }

private:
    int extractIndex(std::string dev) {
        size_t p = dev.find("PhysicalDrive");
        return std::stoi(dev.substr(p + 13));
    }
};
