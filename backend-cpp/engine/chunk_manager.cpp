#include <cstdint>

static const int CHUNK = 4 * 1024 * 1024;

int getChunkSize(int currentFailCount) {
    if (currentFailCount > 2)
        return CHUNK / 2;

    return CHUNK;
}
