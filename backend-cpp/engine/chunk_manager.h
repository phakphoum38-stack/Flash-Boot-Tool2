#pragma once

#include <windows.h>

bool readChunk(
    HANDLE file,
    BYTE* buffer,
    DWORD size,
    DWORD& bytesRead
);
