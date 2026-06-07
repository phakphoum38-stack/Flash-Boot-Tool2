#include "engine/flash_engine_v4.cpp"

int main(int argc, char** argv) {

    if (argc < 3) {
        std::cout << "ERROR: args missing\n";
        return 1;
    }

    std::string mode = argv[1];
    std::string iso = argv[2];
    std::string device = argv[3];

    FlashEngineV4 engine;
    return engine.run(iso, device);
}
