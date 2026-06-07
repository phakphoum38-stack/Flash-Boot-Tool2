#include <unordered_map>
#include <string>

class StateManager {

    std::unordered_map<long long, bool> done;

public:

    StateManager(std::string device) {}

    long long offset() {
        return done.size() * 8192;
    }

    void markDone(long long o) {
        done[o] = true;
    }

    void markBad(long long o) {
        done[o] = true;
    }
};
