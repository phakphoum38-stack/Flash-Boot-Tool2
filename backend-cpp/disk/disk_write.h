#pragma once

#include <windows.h>

bool writeChunk(
    HANDLE h,
    BYTE* buf,
    DWORD size,
    unsigned long long& total
);
