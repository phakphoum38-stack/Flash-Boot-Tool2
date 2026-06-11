#include "chunk_manager.h"

bool readChunk(
    std::ifstream& file,
    BYTE* buffer,
    DWORD chunkSize,
    DWORD& bytesRead
)
{
    file.read(
        (char*)buffer,
        chunkSize
    );

    bytesRead =
        (DWORD)file.gcount();

    return bytesRead > 0;
}
