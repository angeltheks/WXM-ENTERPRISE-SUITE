package com.wxmoneradio.player.buffer;

public enum WxmBufferDecisionReason {
    INITIAL,
    FORCED,
    OFFLINE,
    CRITICAL_NETWORK,
    POOR_NETWORK,
    REBUFFER_PRESSURE,
    METERED_STABLE,
    EXCELLENT_STABLE,
    GOOD_NETWORK,
    ACCEPTABLE_NETWORK,
    HYSTERESIS_HOLD
}
