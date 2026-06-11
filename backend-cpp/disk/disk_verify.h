#pragma once

#include <windows.h>

bool verifyChunk(
    HANDLE h,
    BYTE* expected,
    DWORD size
);
