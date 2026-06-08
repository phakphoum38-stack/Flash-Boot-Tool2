#pragma once

#include <windows.h>

bool retryWrite(
    HANDLE h,
    BYTE* data,
    DWORD size
);
