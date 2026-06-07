#include <windows.h>
#include <iostream>
#include <fstream>
#include <string>

#include "../disk/disk_open.cpp"
#include "../disk/disk_ioctl.cpp"
#include "../engine/progress.cpp"
#include "../engine/retry_engine.cpp"

class FlashEngineV3 {
public:

    int start(const std::string& mode,
              const std::string& iso,
              const std::string& device) {

        int index = extractIndex(device);

        HANDLE disk = openDisk(index);
        if (disk == INVALID_HANDLE_VALUE) {
            std::cout << "ERROR: openDisk failed\n";
            return 1;
        }

        lockDisk(disk);

        std::ifstream file(iso, std::ios::binary);
        if (!file.is_open()) {
            std::cout << "ERROR: cannot open iso\n";
            return 1;
        }

        const size_t CHUNK = 8 * 1024 * 1024; // 🔥 V3 = bigger chunk
        char* buffer = (char*)_aligned_malloc(CHUNK, 4096);

        if (!buffer) {
            std::cout << "ERROR: alloc failed\n";
            return 1;
        }

        file.seekg(0, std::ios::end);
        size_t totalSize = (size_t)file.tellg();
        file.seekg(0);

        size_t written = 0;

        while (file) {

            file.read(buffer, CHUNK);
            std::streamsize size = file.gcount();

            if (size <= 0) break;

            if (!retryWrite(disk, (BYTE*)buffer, (DWORD)size)) {
                std::cout << "ERROR: write failed\n";
                _aligned_free(buffer);
                return 1;
            }

            written += (size_t)size;

            emitProgress((written * 100.0) / totalSize);
        }

        _aligned_free(buffer);

        std::cout << "DONE\n";
        return 0;
    }

private:

    int extractIndex(const std::string& dev) {
        size_t pos = dev.find("PhysicalDrive");
        if (pos == std::string::npos) return -1;
        return std::stoi(dev.substr(pos + 13));
    }
};
