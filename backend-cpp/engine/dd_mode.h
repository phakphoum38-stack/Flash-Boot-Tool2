#pragma once

#include <string>
#include <filesystem>
namespace fs = std::filesystem;

uint64_t isoSize = fs::file_size(iso);

int runDD(
    const std::string& iso,
    const std::string& device,
    uint64_t isoSize
);
