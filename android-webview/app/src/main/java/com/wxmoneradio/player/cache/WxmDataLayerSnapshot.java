package com.wxmoneradio.player.cache;

public final class WxmDataLayerSnapshot {
    public final boolean roomReady;
    public final long lastAudioProfilePersistAtMs;
    public final long lastPlaybackStatePersistAtMs;
    public final long lastHistoryPersistAtMs;
    public final long lastTelemetryPersistAtMs;
    public final long streamConfigPersistCount;
    public final long persistenceFailureCount;
    public final long lastPersistenceFailureAtMs;
    public final String lastPersistenceFailure;

    public WxmDataLayerSnapshot(boolean roomReady, long lastAudioProfilePersistAtMs,
                                long lastPlaybackStatePersistAtMs, long lastHistoryPersistAtMs,
                                long lastTelemetryPersistAtMs, long streamConfigPersistCount,
                                long persistenceFailureCount, long lastPersistenceFailureAtMs,
                                String lastPersistenceFailure) {
        this.roomReady = roomReady;
        this.lastAudioProfilePersistAtMs = lastAudioProfilePersistAtMs;
        this.lastPlaybackStatePersistAtMs = lastPlaybackStatePersistAtMs;
        this.lastHistoryPersistAtMs = lastHistoryPersistAtMs;
        this.lastTelemetryPersistAtMs = lastTelemetryPersistAtMs;
        this.streamConfigPersistCount = streamConfigPersistCount;
        this.persistenceFailureCount = persistenceFailureCount;
        this.lastPersistenceFailureAtMs = lastPersistenceFailureAtMs;
        this.lastPersistenceFailure = lastPersistenceFailure;
    }
}
