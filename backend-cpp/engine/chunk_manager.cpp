#include "chunk_manager.h"

bool readChunk(
    HANDLE file,
    BYTE* buffer,
    DWORD size,
    DWORD& bytesRead
)
{
    return ReadFile(
        file,
        buffer,
        size,
        &bytesRead,
        NULL
    );
}
