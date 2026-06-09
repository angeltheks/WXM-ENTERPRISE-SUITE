package com.wxmoneradio.player.telemetry;

import android.os.SystemClock;

import androidx.annotation.Nullable;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.analytics.AnalyticsListener;
import androidx.media3.exoplayer.source.LoadEventInfo;
import androidx.media3.exoplayer.source.MediaLoadData;

import java.io.IOException;

public final class WxmPlaybackTelemetry implements AnalyticsListener {
    private long playbackRequestedAtMs;
    private long playbackStartedAtMs;
    private long lastReadyAtMs;
    private long playbackRequestedAtElapsedMs;
    private long currentPlaybackSegmentStartedAtElapsedMs;
    private long accumulatedPlaybackDurationMs;
    private long lastStartupDurationMs;
    private long totalStartupDurationMs;
    private long bufferingStartedAtElapsedMs;
    private long totalBufferingMs;
    private int playbackRequestCount;
    private int playbackResumeCount;
    private int playbackPauseCount;
    private int playbackStopCount;
    private int startupCount;
    private int rebufferCount;
    private int playbackErrors;
    private int networkErrors;
    private int retryCount;
    private int fallbackSwitchCount;
    private long lastBandwidthKbps;
    private long networkBytesTransferred;
    private int networkCallCount;
    private int successfulNetworkCallCount;
    private int failedNetworkCallCount;
    private int lastHttpStatusCode;
    private long lastNetworkCallDurationMs;
    private long lastDnsDurationMs;
    private long lastConnectDurationMs;
    private long lastTlsDurationMs;
    private long lastNetworkBytesAtMs;
    private String lastNetworkHost = "";
    private String lastError = "";
    private String lastPauseReason = "";
    private String activeStreamId = "primary";
    private int metadataUpdateCount;
    private long lastMetadataUpdatedAtMs;
    private int audioUnderrunCount;
    private long lastAudioUnderrunAtMs;
    private long lastAudioUnderrunElapsedSinceLastFeedMs;
    private int watchdogRecoveryCount;
    private String lastWatchdogReason = "";
    private int lastPlayerState = Player.STATE_IDLE;

    @Override
    public synchronized void onPlaybackStateChanged(EventTime eventTime, int state) {
        lastPlayerState = state;
        if (state == Player.STATE_READY) {
            long nowWall = System.currentTimeMillis();
            long nowElapsed = SystemClock.elapsedRealtime();
            lastReadyAtMs = nowWall;
            if (playbackStartedAtMs == 0L) {
                playbackStartedAtMs = lastReadyAtMs;
            }
            if (playbackRequestedAtMs != 0L && playbackRequestedAtElapsedMs != 0L) {
                lastStartupDurationMs = Math.max(0L, nowElapsed - playbackRequestedAtElapsedMs);
                totalStartupDurationMs += lastStartupDurationMs;
                startupCount++;
                playbackRequestedAtMs = 0L;
                playbackRequestedAtElapsedMs = 0L;
            }
            endBufferingIfNeeded(nowElapsed);
        } else if (state == Player.STATE_BUFFERING) {
            if (bufferingStartedAtElapsedMs == 0L) {
                bufferingStartedAtElapsedMs = SystemClock.elapsedRealtime();
                rebufferCount++;
            }
        } else if (state == Player.STATE_ENDED || state == Player.STATE_IDLE) {
            endBufferingIfNeeded(SystemClock.elapsedRealtime());
        }
    }

    @Override
    public synchronized void onPlayerError(EventTime eventTime, PlaybackException error) {
        playbackErrors++;
        lastError = error == null ? "unknown" : error.getErrorCodeName();
    }

    @Override
    public synchronized void onLoadError(EventTime eventTime, LoadEventInfo loadEventInfo, MediaLoadData mediaLoadData,
                            IOException error, boolean wasCanceled) {
        if (!wasCanceled) {
            networkErrors++;
            lastError = error == null ? "network_error" : error.getClass().getSimpleName();
        }
    }

    @Override
    public synchronized void onBandwidthEstimate(EventTime eventTime, int totalLoadTimeMs,
                                    long totalBytesLoaded, long bitrateEstimate) {
        if (bitrateEstimate > 0) {
            lastBandwidthKbps = bitrateEstimate / 1000L;
        }
    }

    @Override
    public synchronized void onAudioCodecError(EventTime eventTime, Exception audioCodecError) {
        lastError = audioCodecError == null ? "audio_codec_error" : audioCodecError.getClass().getSimpleName();
    }

    @Override
    public synchronized void onAudioSinkError(EventTime eventTime, Exception audioSinkError) {
        lastError = audioSinkError == null ? "audio_sink_error" : audioSinkError.getClass().getSimpleName();
    }

    @Override
    public synchronized void onAudioUnderrun(EventTime eventTime, int bufferSize, long bufferSizeMs,
                                             long elapsedSinceLastFeedMs) {
        audioUnderrunCount++;
        lastAudioUnderrunAtMs = System.currentTimeMillis();
        lastAudioUnderrunElapsedSinceLastFeedMs = Math.max(0L, elapsedSinceLastFeedMs);
        lastError = "audio_underrun";
    }

    public synchronized void recordRetry(String reason) {
        retryCount++;
        lastError = reason == null ? "" : reason;
    }

    public synchronized void recordPlaybackRequested() {
        playbackRequestCount++;
        playbackRequestedAtMs = System.currentTimeMillis();
        playbackRequestedAtElapsedMs = SystemClock.elapsedRealtime();
    }

    public synchronized void recordPlaybackResumed() {
        if (currentPlaybackSegmentStartedAtElapsedMs == 0L) {
            currentPlaybackSegmentStartedAtElapsedMs = SystemClock.elapsedRealtime();
            playbackResumeCount++;
        }
    }

    public synchronized void recordPlaybackPaused(@Nullable String reason) {
        playbackPauseCount++;
        lastPauseReason = reason == null ? "" : reason;
        endPlaybackSegmentIfNeeded();
    }

    public synchronized void recordPlaybackStopped() {
        playbackStopCount++;
        endPlaybackSegmentIfNeeded();
    }

    public synchronized void recordMetadataUpdate() {
        metadataUpdateCount++;
        lastMetadataUpdatedAtMs = System.currentTimeMillis();
    }

    public synchronized void recordStreamSwitch(@Nullable String streamId) {
        fallbackSwitchCount++;
        activeStreamId = streamId == null ? "unknown" : streamId;
    }

    public synchronized void recordNetworkBytes(int bytes) {
        if (bytes > 0) {
            networkBytesTransferred += bytes;
            lastNetworkBytesAtMs = System.currentTimeMillis();
        }
    }

    public synchronized void recordWatchdogRecovery(@Nullable String reason) {
        watchdogRecoveryCount++;
        lastWatchdogReason = reason == null ? "" : reason;
    }

    public synchronized void recordNetworkCallStarted(@Nullable String host) {
        networkCallCount++;
        lastNetworkHost = host == null ? "" : host;
    }

    public synchronized void recordNetworkCallFinished(@Nullable String host, int statusCode, long totalDurationMs,
                                                       long dnsDurationMs, long connectDurationMs,
                                                       long tlsDurationMs, boolean success) {
        if (success) {
            successfulNetworkCallCount++;
        } else {
            failedNetworkCallCount++;
        }
        lastNetworkHost = host == null ? lastNetworkHost : host;
        lastHttpStatusCode = statusCode;
        lastNetworkCallDurationMs = totalDurationMs;
        lastDnsDurationMs = dnsDurationMs;
        lastConnectDurationMs = connectDurationMs;
        lastTlsDurationMs = tlsDurationMs;
    }

    public synchronized void setActiveStreamId(@Nullable String streamId) {
        activeStreamId = streamId == null ? "unknown" : streamId;
    }

    public synchronized Snapshot snapshot() {
        long nowElapsed = SystemClock.elapsedRealtime();
        long effectivePlaybackDurationMs = accumulatedPlaybackDurationMs;
        boolean activelyPlaying = currentPlaybackSegmentStartedAtElapsedMs != 0L;
        if (activelyPlaying) {
            effectivePlaybackDurationMs += nowElapsed - currentPlaybackSegmentStartedAtElapsedMs;
        }
        long effectiveTotalBufferingMs = totalBufferingMs;
        boolean currentlyBuffering = bufferingStartedAtElapsedMs != 0L;
        if (currentlyBuffering) {
            effectiveTotalBufferingMs += nowElapsed - bufferingStartedAtElapsedMs;
        }
        return new Snapshot(
                activeStreamId,
                playbackRequestedAtMs,
                playbackStartedAtMs,
                lastReadyAtMs,
                effectivePlaybackDurationMs,
                activelyPlaying,
                playbackRequestCount,
                playbackResumeCount,
                playbackPauseCount,
                playbackStopCount,
                startupCount,
                lastStartupDurationMs,
                startupCount == 0 ? 0L : totalStartupDurationMs / startupCount,
                effectiveTotalBufferingMs,
                rebufferCount,
                currentlyBuffering,
                playbackErrors,
                networkErrors,
                retryCount,
                fallbackSwitchCount,
                lastBandwidthKbps,
                networkBytesTransferred,
                networkCallCount,
                successfulNetworkCallCount,
                failedNetworkCallCount,
                lastHttpStatusCode,
                lastNetworkCallDurationMs,
                lastDnsDurationMs,
                lastConnectDurationMs,
                lastTlsDurationMs,
                lastNetworkBytesAtMs,
                lastNetworkHost,
                metadataUpdateCount,
                lastMetadataUpdatedAtMs,
                audioUnderrunCount,
                lastAudioUnderrunAtMs,
                lastAudioUnderrunElapsedSinceLastFeedMs,
                watchdogRecoveryCount,
                lastWatchdogReason,
                lastPauseReason,
                lastPlayerState,
                lastError);
    }

    private void endBufferingIfNeeded(long nowElapsed) {
        if (bufferingStartedAtElapsedMs != 0L) {
            totalBufferingMs += Math.max(0L, nowElapsed - bufferingStartedAtElapsedMs);
            bufferingStartedAtElapsedMs = 0L;
        }
    }

    private void endPlaybackSegmentIfNeeded() {
        if (currentPlaybackSegmentStartedAtElapsedMs != 0L) {
            accumulatedPlaybackDurationMs += Math.max(0L, SystemClock.elapsedRealtime() - currentPlaybackSegmentStartedAtElapsedMs);
            currentPlaybackSegmentStartedAtElapsedMs = 0L;
        }
    }

    public static final class Snapshot {
        public final String activeStreamId;
        public final long playbackRequestedAtMs;
        public final long playbackStartedAtMs;
        public final long lastReadyAtMs;
        public final long playbackDurationMs;
        public final boolean activelyPlaying;
        public final int playbackRequestCount;
        public final int playbackResumeCount;
        public final int playbackPauseCount;
        public final int playbackStopCount;
        public final int startupCount;
        public final long lastStartupDurationMs;
        public final long averageStartupDurationMs;
        public final long totalBufferingMs;
        public final int rebufferCount;
        public final boolean currentlyBuffering;
        public final int playbackErrors;
        public final int networkErrors;
        public final int retryCount;
        public final int fallbackSwitchCount;
        public final long lastBandwidthKbps;
        public final long networkBytesTransferred;
        public final int networkCallCount;
        public final int successfulNetworkCallCount;
        public final int failedNetworkCallCount;
        public final int lastHttpStatusCode;
        public final long lastNetworkCallDurationMs;
        public final long lastDnsDurationMs;
        public final long lastConnectDurationMs;
        public final long lastTlsDurationMs;
        public final long lastNetworkBytesAtMs;
        public final String lastNetworkHost;
        public final int metadataUpdateCount;
        public final long lastMetadataUpdatedAtMs;
        public final int audioUnderrunCount;
        public final long lastAudioUnderrunAtMs;
        public final long lastAudioUnderrunElapsedSinceLastFeedMs;
        public final int watchdogRecoveryCount;
        public final String lastWatchdogReason;
        public final String lastPauseReason;
        public final int lastPlayerState;
        public final String lastError;

        private Snapshot(String activeStreamId, long playbackRequestedAtMs, long playbackStartedAtMs, long lastReadyAtMs,
                         long playbackDurationMs, boolean activelyPlaying, int playbackRequestCount,
                         int playbackResumeCount, int playbackPauseCount, int playbackStopCount, int startupCount,
                         long lastStartupDurationMs, long averageStartupDurationMs, long totalBufferingMs,
                         int rebufferCount, boolean currentlyBuffering, int playbackErrors, int networkErrors, int retryCount,
                         int fallbackSwitchCount, long lastBandwidthKbps, long networkBytesTransferred,
                         int networkCallCount, int successfulNetworkCallCount, int failedNetworkCallCount,
                         int lastHttpStatusCode, long lastNetworkCallDurationMs, long lastDnsDurationMs,
                         long lastConnectDurationMs, long lastTlsDurationMs, long lastNetworkBytesAtMs,
                         String lastNetworkHost, int metadataUpdateCount, long lastMetadataUpdatedAtMs,
                         int audioUnderrunCount, long lastAudioUnderrunAtMs,
                         long lastAudioUnderrunElapsedSinceLastFeedMs, int watchdogRecoveryCount,
                         String lastWatchdogReason, String lastPauseReason, int lastPlayerState,
                         String lastError) {
            this.activeStreamId = activeStreamId;
            this.playbackRequestedAtMs = playbackRequestedAtMs;
            this.playbackStartedAtMs = playbackStartedAtMs;
            this.lastReadyAtMs = lastReadyAtMs;
            this.playbackDurationMs = playbackDurationMs;
            this.activelyPlaying = activelyPlaying;
            this.playbackRequestCount = playbackRequestCount;
            this.playbackResumeCount = playbackResumeCount;
            this.playbackPauseCount = playbackPauseCount;
            this.playbackStopCount = playbackStopCount;
            this.startupCount = startupCount;
            this.lastStartupDurationMs = lastStartupDurationMs;
            this.averageStartupDurationMs = averageStartupDurationMs;
            this.totalBufferingMs = totalBufferingMs;
            this.rebufferCount = rebufferCount;
            this.currentlyBuffering = currentlyBuffering;
            this.playbackErrors = playbackErrors;
            this.networkErrors = networkErrors;
            this.retryCount = retryCount;
            this.fallbackSwitchCount = fallbackSwitchCount;
            this.lastBandwidthKbps = lastBandwidthKbps;
            this.networkBytesTransferred = networkBytesTransferred;
            this.networkCallCount = networkCallCount;
            this.successfulNetworkCallCount = successfulNetworkCallCount;
            this.failedNetworkCallCount = failedNetworkCallCount;
            this.lastHttpStatusCode = lastHttpStatusCode;
            this.lastNetworkCallDurationMs = lastNetworkCallDurationMs;
            this.lastDnsDurationMs = lastDnsDurationMs;
            this.lastConnectDurationMs = lastConnectDurationMs;
            this.lastTlsDurationMs = lastTlsDurationMs;
            this.lastNetworkBytesAtMs = lastNetworkBytesAtMs;
            this.lastNetworkHost = lastNetworkHost;
            this.metadataUpdateCount = metadataUpdateCount;
            this.lastMetadataUpdatedAtMs = lastMetadataUpdatedAtMs;
            this.audioUnderrunCount = audioUnderrunCount;
            this.lastAudioUnderrunAtMs = lastAudioUnderrunAtMs;
            this.lastAudioUnderrunElapsedSinceLastFeedMs = lastAudioUnderrunElapsedSinceLastFeedMs;
            this.watchdogRecoveryCount = watchdogRecoveryCount;
            this.lastWatchdogReason = lastWatchdogReason;
            this.lastPauseReason = lastPauseReason;
            this.lastPlayerState = lastPlayerState;
            this.lastError = lastError;
        }
    }
}
