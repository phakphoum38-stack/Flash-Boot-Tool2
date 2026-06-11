#pragma once

#include <fstream>
#include <windows.h>

bool readChunk(
    std::ifstream& file,
    BYTE* buffer,
    DWORD chunkSize,
    DWORD& bytesRead
);
