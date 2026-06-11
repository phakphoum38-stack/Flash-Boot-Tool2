#include "state_manager.h"

static int g_state = 0;

void setState(int state)
{
    g_state = state;
}

int getState()
{
    return g_state;
}
