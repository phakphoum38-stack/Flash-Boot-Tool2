#pragma once

#include <fstream>

bool readChunk(
    std::ifstream& iso,
    char* buffer,
    size_t size,
    size_t& readSize
);
