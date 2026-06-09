package com.wxmoneradio.player.engine;

public final class WxmFallbackPolicy {
    private final long sourceCooldownMs;
    private final int quarantineAfterConsecutiveFailures;
    private final long quarantineDurationMs;
    private final long minimumPrimaryRecoveryIntervalMs;

    private WxmFallbackPolicy(long sourceCooldownMs,
                              int quarantineAfterConsecutiveFailures,
                              long quarantineDurationMs,
                              long minimumPrimaryRecoveryIntervalMs) {
        this.sourceCooldownMs = sourceCooldownMs;
        this.quarantineAfterConsecutiveFailures = quarantineAfterConsecutiveFailures;
        this.quarantineDurationMs = quarantineDurationMs;
        this.minimumPrimaryRecoveryIntervalMs = minimumPrimaryRecoveryIntervalMs;
    }

    public static WxmFallbackPolicy radioDefault() {
        return new WxmFallbackPolicy(30000L, 3, 180000L, 60000L);
    }

    public long getSourceCooldownMs() {
        return sourceCooldownMs;
    }

    public int getQuarantineAfterConsecutiveFailures() {
        return quarantineAfterConsecutiveFailures;
    }

    public long getQuarantineDurationMs() {
        return quarantineDurationMs;
    }

    public long getMinimumPrimaryRecoveryIntervalMs() {
        return minimumPrimaryRecoveryIntervalMs;
    }
}
