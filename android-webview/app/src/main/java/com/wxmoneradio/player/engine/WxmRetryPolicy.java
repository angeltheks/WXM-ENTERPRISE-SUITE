package com.wxmoneradio.player.engine;

import android.os.SystemClock;

import androidx.annotation.Nullable;
import androidx.media3.common.PlaybackException;

import com.wxmoneradio.player.network.WxmNetworkScore;

import java.io.IOException;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

public final class WxmRetryPolicy {
    private final int maxAttemptsPerSource;
    private final long baseDelayMs;
    private final long maxDelayMs;
    private final long offlineDelayMs;
    private final long cooldownMs;
    private final long burstWindowMs;
    private final int maxFailuresPerBurst;
    private final Random random = new Random();

    private final Map<String, RetryState> statesBySource = new HashMap<>();

    private WxmRetryPolicy(int maxAttemptsPerSource,
                           long baseDelayMs,
                           long maxDelayMs,
                           long offlineDelayMs,
                           long cooldownMs,
                           long burstWindowMs,
                           int maxFailuresPerBurst) {
        this.maxAttemptsPerSource = maxAttemptsPerSource;
        this.baseDelayMs = baseDelayMs;
        this.maxDelayMs = maxDelayMs;
        this.offlineDelayMs = offlineDelayMs;
        this.cooldownMs = cooldownMs;
        this.burstWindowMs = burstWindowMs;
        this.maxFailuresPerBurst = maxFailuresPerBurst;
    }

    public static WxmRetryPolicy radioDefault() {
        return new WxmRetryPolicy(
                3,
                1200L,
                15000L,
                10000L,
                30000L,
                45000L,
                5
        );
    }

    public synchronized Decision evaluate(@Nullable PlaybackException error, int attempt, WxmNetworkScore score) {
        return evaluate("primary", error, attempt, score);
    }

    public synchronized Decision evaluate(String sourceId, @Nullable PlaybackException error, int attempt, WxmNetworkScore score) {
        long now = SystemClock.elapsedRealtime();
        RetryState state = stateFor(sourceId);
        refreshBurstWindow(state, now);

        if (state.cooldownUntilElapsedMs > now) {
            return Decision.retry(state.cooldownUntilElapsedMs - now, RetryReason.COOLDOWN_ACTIVE, false, false);
        }

        if (attempt >= maxAttemptsPerSource) {
            return Decision.doNotRetry(RetryReason.MAX_ATTEMPTS_REACHED, true);
        }

        RetryReason reason = classify(error, score);
        if (!reason.isRecoverable()) {
            return Decision.doNotRetry(reason, true);
        }

        if (score == WxmNetworkScore.OFFLINE) {
            return Decision.retry(offlineDelayMs, RetryReason.OFFLINE_WAIT, false, false);
        }

        state.failuresInBurst++;
        if (state.failuresInBurst >= maxFailuresPerBurst) {
            state.cooldownUntilElapsedMs = now + cooldownMs;
            return Decision.retry(cooldownMs, RetryReason.BURST_COOLDOWN, false, false);
        }

        long boundedDelayMs = Math.min(baseDelayMs * (1L << Math.min(attempt, 4)), maxDelayMs);
        long jitterMs = random.nextInt(650);
        long networkPenaltyMs = networkPenalty(score);
        long reasonPenaltyMs = reasonPenalty(reason);
        return Decision.retry(
                Math.min(maxDelayMs, boundedDelayMs + jitterMs + networkPenaltyMs + reasonPenaltyMs),
                reason,
                false,
                true
        );
    }

    public synchronized void markRecovered() {
        markRecovered("primary");
    }

    public synchronized void markRecovered(String sourceId) {
        RetryState state = stateFor(sourceId);
        state.burstWindowStartedAtElapsedMs = 0L;
        state.failuresInBurst = 0;
        state.cooldownUntilElapsedMs = 0L;
    }

    public int getMaxAttemptsPerSource() {
        return maxAttemptsPerSource;
    }

    public long getCooldownMs() {
        return cooldownMs;
    }

    private void refreshBurstWindow(RetryState state, long now) {
        if (state.burstWindowStartedAtElapsedMs == 0L || now - state.burstWindowStartedAtElapsedMs > burstWindowMs) {
            state.burstWindowStartedAtElapsedMs = now;
            state.failuresInBurst = 0;
        }
    }

    private RetryState stateFor(String sourceId) {
        String safeSourceId = sourceId == null || sourceId.trim().isEmpty() ? "unknown" : sourceId.trim();
        RetryState state = statesBySource.get(safeSourceId);
        if (state == null) {
            state = new RetryState();
            statesBySource.put(safeSourceId, state);
        }
        return state;
    }

    private long networkPenalty(WxmNetworkScore score) {
        if (score == null) {
            return 0L;
        }
        switch (score) {
            case CRITICAL:
                return 5000L;
            case POOR:
                return 2500L;
            case ACCEPTABLE:
                return 750L;
            default:
                return 0L;
        }
    }

    private long reasonPenalty(RetryReason reason) {
        switch (reason) {
            case DECODER_RECOVERABLE:
                return 2000L;
            case STREAM_UNAVAILABLE:
                return 1500L;
            case NETWORK_TIMEOUT:
                return 1000L;
            default:
                return 0L;
        }
    }

    private RetryReason classify(@Nullable PlaybackException error, WxmNetworkScore score) {
        if (error != null) {
            int code = error.errorCode;
            if (code == PlaybackException.ERROR_CODE_PARSING_CONTAINER_MALFORMED
                || code == PlaybackException.ERROR_CODE_PARSING_MANIFEST_MALFORMED
                || code == PlaybackException.ERROR_CODE_DECODING_FORMAT_UNSUPPORTED) {
                return RetryReason.NON_RECOVERABLE_FORMAT;
            }
            if (code == PlaybackException.ERROR_CODE_DECODER_INIT_FAILED
                || code == PlaybackException.ERROR_CODE_DECODING_FAILED
                || code == PlaybackException.ERROR_CODE_AUDIO_TRACK_INIT_FAILED
                || code == PlaybackException.ERROR_CODE_AUDIO_TRACK_WRITE_FAILED) {
                return RetryReason.DECODER_RECOVERABLE;
            }
            if (containsCause(error, SocketTimeoutException.class)) {
                return RetryReason.NETWORK_TIMEOUT;
            }
            if (containsCause(error, UnknownHostException.class)
                || containsCause(error, ConnectException.class)) {
                return RetryReason.STREAM_UNAVAILABLE;
            }
            if (containsCause(error, IOException.class)) {
                return RetryReason.NETWORK_IO;
            }
        }
        if (score == WxmNetworkScore.OFFLINE) {
            return RetryReason.OFFLINE_WAIT;
        }
        if (score == WxmNetworkScore.CRITICAL || score == WxmNetworkScore.POOR) {
            return RetryReason.POOR_NETWORK;
        }
        if (error == null) {
            return RetryReason.RECOVERABLE_PLAYBACK_ERROR;
        }
        return RetryReason.RECOVERABLE_PLAYBACK_ERROR;
    }

    private boolean containsCause(Throwable throwable, Class<? extends Throwable> targetType) {
        Throwable cursor = throwable;
        while (cursor != null) {
            if (targetType.isInstance(cursor)) {
                return true;
            }
            cursor = cursor.getCause();
        }
        return false;
    }

    public enum RetryReason {
        OFFLINE_WAIT(true, "offline_wait"),
        POOR_NETWORK(true, "poor_network"),
        NETWORK_TIMEOUT(true, "network_timeout"),
        NETWORK_IO(true, "network_io"),
        STREAM_UNAVAILABLE(true, "stream_unavailable"),
        DECODER_RECOVERABLE(true, "decoder_recoverable"),
        RECOVERABLE_PLAYBACK_ERROR(true, "recoverable_playback_error"),
        COOLDOWN_ACTIVE(true, "cooldown_active"),
        BURST_COOLDOWN(true, "burst_cooldown"),
        MAX_ATTEMPTS_REACHED(false, "max_attempts_reached"),
        NON_RECOVERABLE_FORMAT(false, "non_recoverable_format");

        private final boolean recoverable;
        private final String key;

        RetryReason(boolean recoverable, String key) {
            this.recoverable = recoverable;
            this.key = key;
        }

        public boolean isRecoverable() {
            return recoverable;
        }

        public String getKey() {
            return key;
        }
    }

    public static final class Decision {
        private final boolean retry;
        private final long delayMs;
        private final RetryReason reason;
        private final boolean sourceExhausted;
        private final boolean countsTowardsAttempt;

        private Decision(boolean retry, long delayMs, RetryReason reason,
                         boolean sourceExhausted, boolean countsTowardsAttempt) {
            this.retry = retry;
            this.delayMs = delayMs;
            this.reason = reason;
            this.sourceExhausted = sourceExhausted;
            this.countsTowardsAttempt = countsTowardsAttempt;
        }

        public static Decision retry(long delayMs, RetryReason reason,
                                     boolean sourceExhausted, boolean countsTowardsAttempt) {
            return new Decision(true, delayMs, reason, sourceExhausted, countsTowardsAttempt);
        }

        public static Decision doNotRetry(RetryReason reason, boolean sourceExhausted) {
            return new Decision(false, 0L, reason, sourceExhausted, false);
        }

        public boolean shouldRetry() {
            return retry;
        }

        public long getDelayMs() {
            return delayMs;
        }

        public String getReason() {
            return reason.getKey();
        }

        public RetryReason getRetryReason() {
            return reason;
        }

        public boolean isSourceExhausted() {
            return sourceExhausted;
        }

        public boolean countsTowardsAttempt() {
            return countsTowardsAttempt;
        }
    }

    private static final class RetryState {
        long burstWindowStartedAtElapsedMs;
        int failuresInBurst;
        long cooldownUntilElapsedMs;
    }
}
