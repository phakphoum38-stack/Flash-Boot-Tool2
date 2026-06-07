#include <windows.h>
#include <iostream>
#include "retry_engine.cpp"
#include "progress.cpp"

bool writeChunk(HANDLE h, BYTE* buf, DWORD size, unsigned long long& total) {
    if (!retryWrite(h, buf, size)) {
        std::cout << "LOG:WRITE_FAIL" << std::endl;
        return false;
    }

    total += size;
    emitProgress(total / (1024.0 * 1024.0));
    return true;
}
