#include "state.h"
#include <fstream>

static const char* STATE_FILE = "flash_state.bin";

void saveState(const FlashState& state) {
    std::ofstream f(STATE_FILE, std::ios::binary);
    f.write((char*)&state, sizeof(state));
}

bool loadState(FlashState& state) {
    std::ifstream f(STATE_FILE, std::ios::binary);
    if (!f) return false;
    f.read((char*)&state, sizeof(state));
    return true;
}

void clearState() {
    remove(STATE_FILE);
}
