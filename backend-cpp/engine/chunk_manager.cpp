#include <fstream>

bool readChunk(
    std::ifstream& iso,
    char* buffer,
    size_t size,
    size_t& readSize
)
{
    iso.read(
        buffer,
        size
    );

    readSize =
        (size_t)iso.gcount();

    return readSize > 0;
}
