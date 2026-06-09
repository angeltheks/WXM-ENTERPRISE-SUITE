package com.wxmoneradio.player.cache;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "telemetry")
public final class TelemetryEntity {
    @PrimaryKey(autoGenerate = true)
    public long id;
    public long capturedAtMs;
    public String activeStreamId;
    public long playbackDurationMs;
    public long totalBufferingMs;
    public int rebufferCount;
    public int playbackErrors;
    public int networkErrors;
    public int retryCount;
    public int fallbackSwitchCount;
    public int metadataUpdateCount;
    public int audioUnderrunCount;
    public long lastAudioUnderrunAtMs;
    public long lastAudioUnderrunElapsedSinceLastFeedMs;
    public int watchdogRecoveryCount;
    public String lastWatchdogReason;

    public TelemetryEntity(long capturedAtMs, String activeStreamId, long playbackDurationMs,
                           long totalBufferingMs, int rebufferCount, int playbackErrors,
                           int networkErrors, int retryCount, int fallbackSwitchCount,
                           int metadataUpdateCount, int audioUnderrunCount,
                           long lastAudioUnderrunAtMs, long lastAudioUnderrunElapsedSinceLastFeedMs,
                           int watchdogRecoveryCount, String lastWatchdogReason) {
        this.capturedAtMs = capturedAtMs;
        this.activeStreamId = activeStreamId;
        this.playbackDurationMs = playbackDurationMs;
        this.totalBufferingMs = totalBufferingMs;
        this.rebufferCount = rebufferCount;
        this.playbackErrors = playbackErrors;
        this.networkErrors = networkErrors;
        this.retryCount = retryCount;
        this.fallbackSwitchCount = fallbackSwitchCount;
        this.metadataUpdateCount = metadataUpdateCount;
        this.audioUnderrunCount = audioUnderrunCount;
        this.lastAudioUnderrunAtMs = lastAudioUnderrunAtMs;
        this.lastAudioUnderrunElapsedSinceLastFeedMs = lastAudioUnderrunElapsedSinceLastFeedMs;
        this.watchdogRecoveryCount = watchdogRecoveryCount;
        this.lastWatchdogReason = lastWatchdogReason;
    }
}
