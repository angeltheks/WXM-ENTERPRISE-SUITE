package com.wxmoneradio.player.network;

public enum WxmNetworkScore {
    OFFLINE(0),
    CRITICAL(1),
    POOR(2),
    ACCEPTABLE(3),
    GOOD(4),
    EXCELLENT(5);

    private final int value;

    WxmNetworkScore(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }
}
