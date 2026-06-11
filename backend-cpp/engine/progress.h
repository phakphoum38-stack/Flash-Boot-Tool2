#pragma once

void emitLog(const char* msg);

void emitProgress(
    double percent
);

void emitVerify(
    double percent
);

void emitSpeed(
    double mbps
);

void emitDone();

void emitFailed();
