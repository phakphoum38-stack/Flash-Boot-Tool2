#pragma once

#include <windows.h>

bool retryWrite(
    HANDLE h,
    BYTE* buf,
    DWORD size,
    int maxRetry = 3
);
