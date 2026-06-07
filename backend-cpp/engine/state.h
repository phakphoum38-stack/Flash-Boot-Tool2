#pragma once
#include <string>

struct FlashState {
    unsigned long long offset = 0;
    unsigned long long total = 0;
    std::string iso;
    std::string device;
    bool verified = false;
};
