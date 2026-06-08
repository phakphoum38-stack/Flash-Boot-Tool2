cmake_minimum_required(VERSION 3.10)

project(FlashTool)

set(CMAKE_CXX_STANDARD 17)

include_directories(
    ${CMAKE_SOURCE_DIR}
    ${CMAKE_SOURCE_DIR}/disk
    ${CMAKE_SOURCE_DIR}/engine
    ${CMAKE_SOURCE_DIR}/ipc
)

add_executable(
    FlashTool

    main.cpp

    disk/disk_open.cpp
    disk/disk_ioctl.cpp
    disk/disk_write.cpp
    disk/disk_verify.cpp

    engine/flash_engine_v4.cpp
    engine/retry_engine.cpp
    engine/progress.cpp
    engine/state_manager.cpp

    ipc/pipe_server.cpp
)
