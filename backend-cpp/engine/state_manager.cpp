#include "state.h"
#include <fstream>

void saveState(const FlashState& st) {
    std::ofstream f("flash_state.bin", std::ios::binary);
    f.write((char*)&st, sizeof(st));
}

bool loadState(FlashState& st) {
    std::ifstream f("flash_state.bin", std::ios::binary);
    if (!f) return false;

    f.read((char*)&st, sizeof(st));
    return true;
}
