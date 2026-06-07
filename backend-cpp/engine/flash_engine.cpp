#include <iostream>
#include <fstream>
#include <windows.h>

#include "../disk/disk_open.cpp"
#include "../disk/disk_ioctl.cpp"
#include "../engine/progress.cpp"
#include "../engine/retry_engine.cpp"

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

        std::ifstream file(iso, std::ios::binary);

        const int CHUNK = 4 * 1024 * 1024;
        char* buffer = new char[CHUNK];

        size_t total = 0;

        while (file.read(buffer, CHUNK) || file.gcount() > 0) {

            DWORD size = file.gcount();

            if (!retryWrite(disk, (BYTE*)buffer, size)) {
                std::cout << "ERROR: write failed\n";
                delete[] buffer;
                return 1;
            }

            total += size;
            emitProgress(total / (1024.0 * 1024.0));
        }

        delete[] buffer;

        std::cout << "DONE\n";
        return 0;
    }

private:
    int extractIndex(std::string dev) {
        size_t pos = dev.find("PhysicalDrive");
        return std::stoi(dev.substr(pos + 13));
    }
};
