#pragma once

enum FlashState
{
    IDLE,
    WRITING,
    VERIFYING,
    DONE,
    FAILED
};

extern FlashState currentState;

void setState(
    FlashState state
);
