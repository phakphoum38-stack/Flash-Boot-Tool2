#pragma once
#include <string>

struct FlashState {
    size_t offset = 0;
    std::string iso;
    std::string device;
    bool done = false;
};
