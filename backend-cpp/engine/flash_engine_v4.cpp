#include <windows.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <thread>
#include <mutex>
#include <condition_variable>

#include "../disk/disk_open.cpp"
#include "../disk/disk_ioctl.cpp"
#include "../engine/progress.cpp"
#include "../engine/retry_engine.cpp"

#define SECTOR 4096

struct SectorBlock {
    std::vector<char> data;
    size_t size;
    size_t offset;
};

class FlashEngineV5 {

public:

    int start(const std::string& mode,
              const std::string& iso,
              const std::string& device) {

        int index = extractIndex(device);

        HANDLE disk = openDisk(index);
        if (disk == INVALID_HANDLE_VALUE) {
            std::cout << "ERROR: disk open failed\n";
            return 1;
        }

        lockDisk(disk);

        std::ifstream file(iso, std::ios::binary);
        if (!file.is_open()) {
            std::cout << "ERROR: iso open failed\n";
            return 1;
        }

        file.seekg(0, std::ios::end);
        size_t totalSize = (size_t)file.tellg();
        file.seekg(0);

        const size_t CHUNK = 8 * 1024 * 1024;

        std::vector<SectorBlock> queue;
        std::mutex mtx;
        std::condition_variable cv;

        bool readingDone = false;
        bool errorFlag = false;

        size_t written = 0;

        // =========================
        // READ THREAD (ISO → QUEUE)
        // =========================
        std::thread reader([&]() {

            size_t offset = 0;

            while (file) {

                SectorBlock block;
                block.data.resize(CHUNK);
                block.offset = offset;

                file.read(block.data.data(), CHUNK);
                block.size = (size_t)file.gcount();

                if (block.size == 0) break;

                {
                    std::lock_guard<std::mutex> lock(mtx);
                    queue.push_back(std::move(block));
                }

                cv.notify_one();

                offset += block.size;
            }

            readingDone = true;
            cv.notify_all();
        });

        // =========================
        // WRITE THREAD (ASYNC IO)
        // =========================
        std::thread writer([&]() {

            while (true) {

                SectorBlock block;

                {
                    std::unique_lock<std::mutex> lock(mtx);

                    cv.wait(lock, [&]() {
                        return !queue.empty() || readingDone;
                    });

                    if (queue.empty() && readingDone)
                        break;

                    block = std::move(queue.back());
                    queue.pop_back();
                }

                if (!asyncWrite(disk, block)) {
                    std::cout << "ERROR: write failed\n";
                    errorFlag = true;
                    break;
                }

                written += block.size;

                emitProgress((written * 100.0) / totalSize);
            }
        });

        reader.join();
        writer.join();

        if (errorFlag) {
            std::cout << "FAILED\n";
            return 1;
        }

        // =========================
        // VERIFY PHASE
        // =========================
        std::cout << "VERIFY START\n";
        if (!verifyDisk(disk, iso)) {
            std::cout << "VERIFY FAILED\n";
            return 1;
        }

        std::cout << "DONE\n";
        return 0;
    }

private:

    int extractIndex(const std::string& dev) {
        size_t pos = dev.find("PhysicalDrive");
        return std::stoi(dev.substr(pos + 13));
    }

    // =========================
    // ASYNC WRITE (OVERLAPPED IO)
    // =========================
    bool asyncWrite(HANDLE disk, SectorBlock& block) {

        OVERLAPPED ov = {0};
        ov.Offset = (DWORD)(block.offset & 0xFFFFFFFF);
        ov.OffsetHigh = (DWORD)(block.offset >> 32);

        DWORD written = 0;

        for (int i = 0; i < 3; i++) {

            BOOL ok = WriteFile(
                disk,
                block.data.data(),
                (DWORD)block.size,
                &written,
                &ov
            );

            if (ok || GetLastError() == ERROR_IO_PENDING) {
                GetOverlappedResult(disk, &ov, &written, TRUE);
                return true;
            }

            Sleep(30);
        }

        return false;
    }

    // =========================
    // VERIFY PASS
    // =========================
    bool verifyDisk(HANDLE disk, const std::string& iso) {

        std::ifstream file(iso, std::ios::binary);

        const size_t CHUNK = 4 * 1024 * 1024;

        char* buf1 = new char[CHUNK];
        char* buf2 = new char[CHUNK];

        size_t offset = 0;

        while (file) {

            file.read(buf1, CHUNK);
            size_t size = file.gcount();
            if (size == 0) break;

            DWORD read = 0;

            OVERLAPPED ov = {0};
            ov.Offset = (DWORD)(offset & 0xFFFFFFFF);
            ov.OffsetHigh = (DWORD)(offset >> 32);

            if (!ReadFile(disk, buf2, (DWORD)size, &read, &ov)) {
                delete[] buf1;
                delete[] buf2;
                return false;
            }

            if (memcmp(buf1, buf2, size) != 0) {
                delete[] buf1;
                delete[] buf2;
                return false;
            }

            offset += size;
        }

        delete[] buf1;
        delete[] buf2;
        return true;
    }
};
