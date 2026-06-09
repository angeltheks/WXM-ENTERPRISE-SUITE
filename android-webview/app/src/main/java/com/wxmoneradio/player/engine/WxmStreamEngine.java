package com.wxmoneradio.player.engine;

import androidx.media3.common.PlaybackException;

import com.wxmoneradio.player.network.WxmNetworkMonitor;
import com.wxmoneradio.player.network.WxmNetworkScore;
import com.wxmoneradio.player.telemetry.WxmPlaybackTelemetry;

public final class WxmStreamEngine {
    private final WxmFallbackManager fallbackManager;
    private final WxmRetryPolicy retryPolicy;
    private final WxmNetworkMonitor networkMonitor;
    private final WxmPlaybackTelemetry telemetry;
    private final WxmStreamUrlPolicy streamUrlPolicy = new WxmStreamUrlPolicy();
    private WxmStreamLifecycleState lifecycleState = WxmStreamLifecycleState.IDLE;
    private long lastTransitionAtMs = System.currentTimeMillis();
    private String lastTransitionReason = "created";
    private int rejectedRuntimePrimaryCount;

    public WxmStreamEngine(WxmFallbackManager fallbackManager,
                           WxmRetryPolicy retryPolicy,
                           WxmNetworkMonitor networkMonitor,
                           WxmPlaybackTelemetry telemetry) {
        this.fallbackManager = fallbackManager;
        this.retryPolicy = retryPolicy;
        this.networkMonitor = networkMonitor;
        this.telemetry = telemetry;
    }

    public WxmStreamSource configureRuntimePrimary(String url) {
        String safeUrl = streamUrlPolicy.sanitize(url);
        if (safeUrl == null) {
            rejectedRuntimePrimaryCount++;
            transitionTo(WxmStreamLifecycleState.FAILED, "runtime_primary_rejected");
            return fallbackManager.getCurrentSource();
        }
        fallbackManager.setRuntimePrimary(safeUrl);
        WxmStreamSource source = fallbackManager.getCurrentSource();
        if (source != null) {
            telemetry.setActiveStreamId(source.getId());
        }
        transitionTo(WxmStreamLifecycleState.CONFIGURED, "runtime_primary_configured");
        return source;
    }

    public WxmStreamSource getCurrentSource() {
        return fallbackManager.getCurrentSource();
    }

    public WxmNetworkScore getNetworkScore() {
        return networkMonitor != null ? networkMonitor.getCurrentScore() : WxmNetworkScore.ACCEPTABLE;
    }

    public WxmRetryPolicy.Decision evaluateRetry(PlaybackException error, int attempt) {
        WxmStreamSource source = fallbackManager.getCurrentSource();
        transitionTo(WxmStreamLifecycleState.RETRYING, "retry_evaluated");
        return retryPolicy.evaluate(source != null ? source.getId() : "unknown", error, attempt, getNetworkScore());
    }

    public boolean moveToNextFallback() {
        boolean moved = fallbackManager.moveToNextFallback();
        if (moved) {
            WxmStreamSource source = fallbackManager.getCurrentSource();
            telemetry.recordStreamSwitch(source != null ? source.getId() : "unknown");
            transitionTo(WxmStreamLifecycleState.SWITCHING_FALLBACK, "fallback_selected");
        }
        return moved;
    }

    public void beginNewFallbackRound() {
        fallbackManager.beginNewFallbackRound();
        WxmStreamSource source = fallbackManager.getCurrentSource();
        if (source != null) {
            telemetry.setActiveStreamId(source.getId());
        }
        transitionTo(WxmStreamLifecycleState.CONFIGURED, "fallback_round_reset");
    }

    public boolean tryRecoverPrimary() {
        WxmStreamSource previousSource = fallbackManager.getCurrentSource();
        boolean recovered = fallbackManager.tryRecoverPrimary();
        if (recovered) {
            WxmStreamSource source = fallbackManager.getCurrentSource();
            if (source != null) {
                if (previousSource == null || !source.getId().equals(previousSource.getId())) {
                    telemetry.recordStreamSwitch(source.getId());
                } else {
                    telemetry.setActiveStreamId(source.getId());
                }
            }
            transitionTo(WxmStreamLifecycleState.RECOVERING_PRIMARY, "primary_recovery_probe");
        }
        return recovered;
    }

    public void markReady() {
        fallbackManager.markHealth(WxmStreamHealth.HEALTHY);
        WxmStreamSource source = fallbackManager.getCurrentSource();
        retryPolicy.markRecovered(source != null ? source.getId() : "unknown");
        transitionTo(WxmStreamLifecycleState.READY, "player_ready");
    }

    public void markBuffering() {
        fallbackManager.markHealth(WxmStreamHealth.BUFFERING);
        transitionTo(WxmStreamLifecycleState.BUFFERING, "player_buffering");
    }

    public void markFailed() {
        fallbackManager.markHealth(WxmStreamHealth.FAILED);
        transitionTo(WxmStreamLifecycleState.FAILED, "player_failed");
    }

    public void markRecovering() {
        fallbackManager.markHealth(WxmStreamHealth.RECOVERING);
        transitionTo(WxmStreamLifecycleState.RETRYING, "recovery_in_progress");
    }

    public void recordRetry(String reason) {
        telemetry.recordRetry(reason);
    }

    public void markStarting() {
        transitionTo(WxmStreamLifecycleState.STARTING, "playback_starting");
    }

    public void markPlaying() {
        transitionTo(WxmStreamLifecycleState.PLAYING, "player_playing");
    }

    public void markPaused() {
        transitionTo(WxmStreamLifecycleState.PAUSED, "player_paused");
    }

    public void markStopped() {
        transitionTo(WxmStreamLifecycleState.STOPPED, "player_stopped");
    }

    public WxmStreamSnapshot snapshot() {
        WxmStreamSource source = fallbackManager.getCurrentSource();
        return new WxmStreamSnapshot(
                lifecycleState,
                source != null ? source.getId() : "none",
                source != null ? source.getUrl() : "",
                source != null && source.isSecureHttps(),
                lastTransitionAtMs,
                lastTransitionReason,
                rejectedRuntimePrimaryCount
        );
    }

    private void transitionTo(WxmStreamLifecycleState state, String reason) {
        lifecycleState = state == null ? WxmStreamLifecycleState.IDLE : state;
        lastTransitionReason = reason == null ? "unknown" : reason;
        lastTransitionAtMs = System.currentTimeMillis();
    }
}
