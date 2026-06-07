#include <windows.h>
#include <iostream>
#include <fstream>
#include <queue>
#include <vector>
#include <thread>
#include <mutex>
#include <condition_variable>

#include "../disk/disk_open.cpp"
#include "../disk/disk_ioctl.cpp"
#include "../engine/progress.cpp"
#include "../engine/retry_engine.cpp"

struct Chunk {
    std::vector<char> data;
    size_t size;
};

class FlashEngineV4 {
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

        const size_t CHUNK_SIZE = 8 * 1024 * 1024;

        std::queue<Chunk> queue;
        std::mutex mtx;
        std::condition_variable cv;

        bool readingDone = false;
        bool writeError = false;

        size_t written = 0;

        // =========================
        // PRODUCER THREAD (READ ISO)
        // =========================
        std::thread reader([&]() {
            while (file) {

                Chunk c;
                c.data.resize(CHUNK_SIZE);

                file.read(c.data.data(), CHUNK_SIZE);
                c.size = (size_t)file.gcount();

                if (c.size == 0) break;

                {
                    std::unique_lock<std::mutex> lock(mtx);
                    queue.push(std::move(c));
                }

                cv.notify_one();
            }

            readingDone = true;
            cv.notify_all();
        });

        // =========================
        // CONSUMER THREAD (WRITE USB)
        // =========================
        std::thread writer([&]() {

            while (true) {

                Chunk chunk;

                {
                    std::unique_lock<std::mutex> lock(mtx);

                    cv.wait(lock, [&]() {
                        return !queue.empty() || readingDone;
                    });

                    if (queue.empty() && readingDone)
                        break;

                    chunk = std::move(queue.front());
                    queue.pop();
                }

                if (!retryWrite(disk,
                                (BYTE*)chunk.data.data(),
                                (DWORD)chunk.size)) {
                    writeError = true;
                    std::cout << "ERROR: write chunk failed\n";
                    break;
                }

                written += chunk.size;

                emitProgress((written * 100.0) / totalSize);
            }
        });

        reader.join();
        writer.join();

        if (writeError) {
            std::cout << "FAILED\n";
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
};
