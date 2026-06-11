#include "state_manager.h"

FlashState currentState =
    IDLE;

void setState(
    FlashState state
)
{
    currentState =
        state;
}
