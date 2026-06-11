#include <chrono>

static auto startTime =
    std::chrono::steady_clock::now();
double calculateSpeed(
    unsigned long long bytes
)
{
    auto now =
        std::chrono::steady_clock::now();

    double sec =
        std::chrono::duration<double>(
            now - startTime
        ).count();

    if (sec <= 0)
        return 0;

    return
        (bytes / 1024.0 / 1024.0)
        / sec;
}
