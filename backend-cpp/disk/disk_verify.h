#pragma once

#include <windows.h>

bool verifyChunk(
    HANDLE h,
    BYTE* buf,
    DWORD size
);
