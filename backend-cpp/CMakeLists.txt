cmake_minimum_required(VERSION 3.10)

project(FlashTool)

set(CMAKE_CXX_STANDARD 17)

include_directories(
    .
    disk
    engine
    ipc
)

add_executable(
    FlashTool

    main.cpp

    disk/disk_open.cpp
    disk/disk_ioctl.cpp
    disk/disk_write.cpp
    disk/disk_verify.cpp

    engine/chunk_manager.cpp
    engine/flash_engine_v4.cpp
    engine/progress.cpp
    engine/retry_engine.cpp
    engine/state_manager.cpp

    ipc/pipe_server.cpp
)
