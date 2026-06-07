cmake_minimum_required(VERSION 3.15)
project(FlashEngine)

set(CMAKE_CXX_STANDARD 17)

add_executable(flash-engine
    main.cpp

    disk/disk_open.cpp
    disk/disk_write.cpp
    disk/disk_ioctl.cpp
    disk/disk_verify.cpp

    engine/flash_engine.cpp
    engine/chunk_manager.cpp
    engine/retry_engine.cpp
    engine/progress.cpp

    ipc/pipe_server.cpp
)

target_link_libraries(flash-engine
    ole32
    setupapi
)
