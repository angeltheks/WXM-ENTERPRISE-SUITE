package com.wxmoneradio.player.buffer;

public enum WxmBufferProfile {
    LOW_LATENCY(4000, 18000, 800, 1500, 5000, 0),
    STANDARD(12000, 45000, 1800, 3500, 15000, 1),
    BATTERY_SAVER(20000, 70000, 3000, 7000, 30000, 2),
    STABLE_RADIO(25000, 90000, 2500, 6000, 30000, 3),
    POOR_NETWORK(35000, 120000, 3500, 9000, 45000, 4);

    private final int minBufferMs;
    private final int maxBufferMs;
    private final int bufferForPlaybackMs;
    private final int bufferForPlaybackAfterRebufferMs;
    private final int backBufferMs;
    private final int protectionRank;

    WxmBufferProfile(int minBufferMs, int maxBufferMs, int bufferForPlaybackMs,
                     int bufferForPlaybackAfterRebufferMs, int backBufferMs,
                     int protectionRank) {
        this.minBufferMs = minBufferMs;
        this.maxBufferMs = maxBufferMs;
        this.bufferForPlaybackMs = bufferForPlaybackMs;
        this.bufferForPlaybackAfterRebufferMs = bufferForPlaybackAfterRebufferMs;
        this.backBufferMs = backBufferMs;
        this.protectionRank = protectionRank;
    }

    public int getMinBufferMs() {
        return minBufferMs;
    }

    public int getMaxBufferMs() {
        return maxBufferMs;
    }

    public int getBufferForPlaybackMs() {
        return bufferForPlaybackMs;
    }

    public int getBufferForPlaybackAfterRebufferMs() {
        return bufferForPlaybackAfterRebufferMs;
    }

    public int getBackBufferMs() {
        return backBufferMs;
    }

    public int getProtectionRank() {
        return protectionRank;
    }
}
