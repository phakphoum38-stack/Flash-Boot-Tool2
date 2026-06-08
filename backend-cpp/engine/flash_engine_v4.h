#pragma once

#include <string>

class FlashEngineV4 {
public:
    int run(
        std::string mode,
        std::string iso,
        std::string device
    );
};
