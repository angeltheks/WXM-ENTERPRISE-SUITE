package com.wxmoneradio.player.recovery;

import android.os.Handler;
import android.os.SystemClock;

import androidx.media3.common.C;
import androidx.media3.common.Player;

public final class WxmPlaybackRecoveryController {
    public interface Delegate {
        Player getPlayer();
        boolean isUserStopped();
        boolean tryRecoverPrimary();
        void onPrimaryRecovered();
        void onPrimaryRecoveryDeferred();
        void onWatchdogRecovery(String reason);
    }

    private final Handler handler;
    private final Delegate delegate;
    private final long primaryRecoveryDelayMs;
    private final long watchdogIntervalMs;
    private final long readyStallThresholdMs;
    private final long bufferingStallThresholdMs;
    private boolean primaryRecoveryScheduled;
    private long lastObservedPlayerPositionMs = C.TIME_UNSET;
    private long lastPlayerProgressAtMs;
    private long lastWatchdogRecoveryAtMs;

    private final Runnable primaryRecoveryRunnable = new Runnable() {
        @Override
        public void run() {
            primaryRecoveryScheduled = false;
            if (delegate.isUserStopped()) {
                return;
            }
            if (delegate.tryRecoverPrimary()) {
                delegate.onPrimaryRecovered();
                return;
            }
            delegate.onPrimaryRecoveryDeferred();
            schedulePrimaryRecovery();
        }
    };

    private final Runnable playbackWatchdogRunnable = new Runnable() {
        @Override
        public void run() {
            inspectPlaybackHealth();
            if (delegate.getPlayer() != null && !delegate.isUserStopped()) {
                handler.postDelayed(this, watchdogIntervalMs);
            }
        }
    };

    public WxmPlaybackRecoveryController(Handler handler, Delegate delegate,
                                         long primaryRecoveryDelayMs, long watchdogIntervalMs,
                                         long readyStallThresholdMs, long bufferingStallThresholdMs) {
        this.handler = handler;
        this.delegate = delegate;
        this.primaryRecoveryDelayMs = primaryRecoveryDelayMs;
        this.watchdogIntervalMs = watchdogIntervalMs;
        this.readyStallThresholdMs = readyStallThresholdMs;
        this.bufferingStallThresholdMs = bufferingStallThresholdMs;
    }

    public void schedulePrimaryRecovery() {
        if (delegate.isUserStopped() || primaryRecoveryScheduled) {
            return;
        }
        primaryRecoveryScheduled = true;
        handler.postDelayed(primaryRecoveryRunnable, primaryRecoveryDelayMs);
    }

    public void cancelPrimaryRecovery() {
        primaryRecoveryScheduled = false;
        handler.removeCallbacks(primaryRecoveryRunnable);
    }

    public void schedulePlaybackWatchdog() {
        handler.removeCallbacks(playbackWatchdogRunnable);
        resetPlaybackWatchdog();
        handler.postDelayed(playbackWatchdogRunnable, watchdogIntervalMs);
    }

    public void cancelPlaybackWatchdog() {
        handler.removeCallbacks(playbackWatchdogRunnable);
    }

    public void resetPlaybackWatchdog() {
        lastObservedPlayerPositionMs = C.TIME_UNSET;
        lastPlayerProgressAtMs = SystemClock.elapsedRealtime();
    }

    public void notePlayerProgress() {
        Player player = delegate.getPlayer();
        if (player == null) {
            resetPlaybackWatchdog();
            return;
        }
        lastObservedPlayerPositionMs = player.getCurrentPosition();
        lastPlayerProgressAtMs = SystemClock.elapsedRealtime();
    }

    public void shutdown() {
        cancelPrimaryRecovery();
        cancelPlaybackWatchdog();
    }

    private void inspectPlaybackHealth() {
        Player player = delegate.getPlayer();
        if (player == null || delegate.isUserStopped()) {
            return;
        }
        long now = SystemClock.elapsedRealtime();
        int playbackState = player.getPlaybackState();
        long currentPositionMs = player.getCurrentPosition();
        if (currentPositionMs > lastObservedPlayerPositionMs) {
            lastObservedPlayerPositionMs = currentPositionMs;
            lastPlayerProgressAtMs = now;
            return;
        }
        if (lastPlayerProgressAtMs == 0L) {
            notePlayerProgress();
            return;
        }
        if (playbackState == Player.STATE_BUFFERING
                && now - lastPlayerProgressAtMs >= bufferingStallThresholdMs) {
            recoverFromWatchdog("buffering_stall", now);
            return;
        }
        if (playbackState == Player.STATE_READY
                && player.isPlaying()
                && now - lastPlayerProgressAtMs >= readyStallThresholdMs) {
            recoverFromWatchdog("ready_audio_stall", now);
        }
    }

    private void recoverFromWatchdog(String reason, long now) {
        if (now - lastWatchdogRecoveryAtMs < readyStallThresholdMs) {
            return;
        }
        lastWatchdogRecoveryAtMs = now;
        delegate.onWatchdogRecovery(reason);
    }
}
