package com.wxmoneradio.player.buffer;

import android.os.SystemClock;

import androidx.annotation.Nullable;
import androidx.media3.exoplayer.DefaultLoadControl;
import androidx.media3.exoplayer.LoadControl;

import com.wxmoneradio.player.network.WxmNetworkScore;
import com.wxmoneradio.player.network.WxmNetworkSnapshot;
import com.wxmoneradio.player.telemetry.WxmPlaybackTelemetry;

import java.util.ArrayDeque;
import java.util.Deque;

public final class WxmBufferEngine {
    private static final long SAMPLE_WINDOW_MS = 120000L;
    private static final long DEESCALATION_STABLE_WINDOW_MS = 90000L;
    private static final long MIN_ACTIVE_PROFILE_HOLD_MS = 60000L;

    private final Deque<BufferSample> samples = new ArrayDeque<>();
    private WxmBufferProfile forcedProfile;
    private WxmBufferProfile activeProfile = WxmBufferProfile.STANDARD;
    private WxmBufferProfile recommendedProfile = WxmBufferProfile.STANDARD;
    private WxmBufferHealth health = WxmBufferHealth.STABLE;
    private WxmBufferDecisionReason reason = WxmBufferDecisionReason.INITIAL;
    private long activeProfileAppliedAtMs = System.currentTimeMillis();
    private long lastRecommendationChangedAtElapsedMs = SystemClock.elapsedRealtime();
    private long lastPressureAtElapsedMs;
    private int appliedProfileChangeCount;
    private int recentRebufferCount;
    private long recentBufferingMs;
    private long lastEvaluatedAtMs = activeProfileAppliedAtMs;

    public synchronized void setForcedProfile(@Nullable WxmBufferProfile profile) {
        forcedProfile = profile;
    }

    public synchronized WxmBufferProfile resolveProfile(@Nullable WxmNetworkScore score) {
        return profileForScore(score);
    }

    public synchronized WxmBufferSnapshot evaluate(@Nullable WxmNetworkSnapshot network,
                                                   @Nullable WxmPlaybackTelemetry.Snapshot telemetry) {
        long nowWall = System.currentTimeMillis();
        long nowElapsed = SystemClock.elapsedRealtime();
        sampleTelemetry(nowElapsed, telemetry);
        health = resolveHealth(network);
        if (health != WxmBufferHealth.STABLE) {
            lastPressureAtElapsedMs = nowElapsed;
        }

        ProfileDecision target = chooseTarget(network, health);
        WxmBufferProfile chosenProfile = applyHysteresis(target.profile, target.reason, nowElapsed);
        recommendedProfile = chosenProfile;
        lastEvaluatedAtMs = nowWall;
        return snapshot(nowWall, nowElapsed);
    }

    public synchronized LoadControl createLoadControl(@Nullable WxmNetworkSnapshot network,
                                                      @Nullable WxmPlaybackTelemetry.Snapshot telemetry) {
        evaluate(network, telemetry);
        applyRecommendedProfile(System.currentTimeMillis(), SystemClock.elapsedRealtime());
        return createLoadControlFor(activeProfile);
    }

    public synchronized LoadControl createLoadControl(@Nullable WxmNetworkScore score) {
        WxmNetworkScore resolvedScore = score == null ? WxmNetworkScore.ACCEPTABLE : score;
        WxmNetworkSnapshot snapshot = new WxmNetworkSnapshot(
                resolvedScore,
                resolvedScore,
                resolvedScore != WxmNetworkScore.OFFLINE,
                resolvedScore != WxmNetworkScore.OFFLINE && resolvedScore != WxmNetworkScore.CRITICAL,
                false,
                "compat",
                0,
                System.currentTimeMillis(),
                0L,
                0L,
                0L,
                0L
        );
        return createLoadControl(snapshot, null);
    }

    public synchronized WxmBufferSnapshot snapshot() {
        return snapshot(System.currentTimeMillis(), SystemClock.elapsedRealtime());
    }

    private void sampleTelemetry(long now, @Nullable WxmPlaybackTelemetry.Snapshot telemetry) {
        if (telemetry == null) {
            pruneSamples(now);
            recomputeRecentPressure();
            return;
        }
        samples.addLast(new BufferSample(now, telemetry.rebufferCount, telemetry.totalBufferingMs));
        pruneSamples(now);
        recomputeRecentPressure();
    }

    private void pruneSamples(long now) {
        while (samples.size() > 1 && now - samples.peekFirst().timestampMs > SAMPLE_WINDOW_MS) {
            samples.removeFirst();
        }
    }

    private void recomputeRecentPressure() {
        if (samples.isEmpty()) {
            recentRebufferCount = 0;
            recentBufferingMs = 0L;
            return;
        }
        BufferSample first = samples.peekFirst();
        BufferSample last = samples.peekLast();
        recentRebufferCount = Math.max(0, last.rebufferCount - first.rebufferCount);
        recentBufferingMs = Math.max(0L, last.totalBufferingMs - first.totalBufferingMs);
    }

    private WxmBufferHealth resolveHealth(@Nullable WxmNetworkSnapshot network) {
        if (network == null || !network.connected || network.score == WxmNetworkScore.OFFLINE) {
            return WxmBufferHealth.CRITICAL;
        }
        if (network.score == WxmNetworkScore.CRITICAL
                || recentRebufferCount >= 3
                || recentBufferingMs >= 10000L) {
            return WxmBufferHealth.CRITICAL;
        }
        if (network.score == WxmNetworkScore.POOR
                || recentRebufferCount >= 2
                || recentBufferingMs >= 4000L) {
            return WxmBufferHealth.PRESSURED;
        }
        if (recentRebufferCount >= 1 || recentBufferingMs > 0L) {
            return WxmBufferHealth.WATCH;
        }
        return WxmBufferHealth.STABLE;
    }

    private ProfileDecision chooseTarget(@Nullable WxmNetworkSnapshot network, WxmBufferHealth currentHealth) {
        if (forcedProfile != null) {
            return new ProfileDecision(forcedProfile, WxmBufferDecisionReason.FORCED);
        }
        if (network == null || !network.connected || network.score == WxmNetworkScore.OFFLINE) {
            return new ProfileDecision(WxmBufferProfile.POOR_NETWORK, WxmBufferDecisionReason.OFFLINE);
        }
        if (network.score == WxmNetworkScore.CRITICAL) {
            return new ProfileDecision(WxmBufferProfile.POOR_NETWORK, WxmBufferDecisionReason.CRITICAL_NETWORK);
        }
        if (currentHealth == WxmBufferHealth.CRITICAL) {
            return new ProfileDecision(WxmBufferProfile.POOR_NETWORK, WxmBufferDecisionReason.REBUFFER_PRESSURE);
        }
        if (network.score == WxmNetworkScore.POOR) {
            return new ProfileDecision(WxmBufferProfile.POOR_NETWORK, WxmBufferDecisionReason.POOR_NETWORK);
        }
        if (currentHealth == WxmBufferHealth.PRESSURED || currentHealth == WxmBufferHealth.WATCH) {
            return new ProfileDecision(WxmBufferProfile.STABLE_RADIO, WxmBufferDecisionReason.REBUFFER_PRESSURE);
        }
        if (network.metered && (network.score == WxmNetworkScore.GOOD || network.score == WxmNetworkScore.EXCELLENT)) {
            return new ProfileDecision(WxmBufferProfile.BATTERY_SAVER, WxmBufferDecisionReason.METERED_STABLE);
        }
        if (network.score == WxmNetworkScore.EXCELLENT) {
            return new ProfileDecision(WxmBufferProfile.STABLE_RADIO, WxmBufferDecisionReason.EXCELLENT_STABLE);
        }
        if (network.score == WxmNetworkScore.GOOD) {
            return new ProfileDecision(WxmBufferProfile.STABLE_RADIO, WxmBufferDecisionReason.GOOD_NETWORK);
        }
        return new ProfileDecision(WxmBufferProfile.STABLE_RADIO, WxmBufferDecisionReason.ACCEPTABLE_NETWORK);
    }

    private WxmBufferProfile applyHysteresis(WxmBufferProfile desired,
                                             WxmBufferDecisionReason desiredReason,
                                             long nowElapsed) {
        if (forcedProfile != null) {
            reason = desiredReason;
            lastRecommendationChangedAtElapsedMs = nowElapsed;
            return desired;
        }
        if (desired.getProtectionRank() > recommendedProfile.getProtectionRank()) {
            reason = desiredReason;
            lastRecommendationChangedAtElapsedMs = nowElapsed;
            return desired;
        }
        if (desired.getProtectionRank() < recommendedProfile.getProtectionRank()) {
            long stableForMs = lastPressureAtElapsedMs == 0L ? Long.MAX_VALUE : nowElapsed - lastPressureAtElapsedMs;
            long heldForMs = nowElapsed - lastRecommendationChangedAtElapsedMs;
            if (health == WxmBufferHealth.STABLE
                    && stableForMs >= DEESCALATION_STABLE_WINDOW_MS
                    && heldForMs >= MIN_ACTIVE_PROFILE_HOLD_MS) {
                reason = desiredReason;
                lastRecommendationChangedAtElapsedMs = nowElapsed;
                return desired;
            }
            reason = WxmBufferDecisionReason.HYSTERESIS_HOLD;
            return recommendedProfile;
        }
        reason = desiredReason;
        return desired;
    }

    private void applyRecommendedProfile(long nowWall, long nowElapsed) {
        if (activeProfile != recommendedProfile) {
            activeProfile = recommendedProfile;
            activeProfileAppliedAtMs = nowWall;
            appliedProfileChangeCount++;
        }
    }

    private LoadControl createLoadControlFor(WxmBufferProfile profile) {
        return new DefaultLoadControl.Builder()
                .setBufferDurationsMs(
                        profile.getMinBufferMs(),
                        profile.getMaxBufferMs(),
                        profile.getBufferForPlaybackMs(),
                        profile.getBufferForPlaybackAfterRebufferMs())
                .setPrioritizeTimeOverSizeThresholds(true)
                .setBackBuffer(profile.getBackBufferMs(), false)
                .build();
    }

    private WxmBufferSnapshot snapshot(long nowWall, long nowElapsed) {
        long stableForMs = lastPressureAtElapsedMs == 0L ? Long.MAX_VALUE : nowElapsed - lastPressureAtElapsedMs;
        long holdRemainingMs = health == WxmBufferHealth.STABLE && stableForMs < DEESCALATION_STABLE_WINDOW_MS
                ? DEESCALATION_STABLE_WINDOW_MS - stableForMs
                : 0L;
        return new WxmBufferSnapshot(
                activeProfile,
                recommendedProfile,
                health,
                reason,
                activeProfile != recommendedProfile,
                recentRebufferCount,
                recentBufferingMs,
                appliedProfileChangeCount,
                activeProfileAppliedAtMs,
                lastEvaluatedAtMs == 0L ? nowWall : lastEvaluatedAtMs,
                holdRemainingMs,
                forcedProfile != null
        );
    }

    private WxmBufferProfile profileForScore(@Nullable WxmNetworkScore score) {
        if (score == null) {
            return WxmBufferProfile.STANDARD;
        }
        switch (score) {
            case OFFLINE:
            case CRITICAL:
            case POOR:
                return WxmBufferProfile.POOR_NETWORK;
            case EXCELLENT:
                return WxmBufferProfile.STABLE_RADIO;
            case GOOD:
                return WxmBufferProfile.STABLE_RADIO;
            case ACCEPTABLE:
            default:
                return WxmBufferProfile.STABLE_RADIO;
        }
    }

    private static final class BufferSample {
        final long timestampMs;
        final int rebufferCount;
        final long totalBufferingMs;

        BufferSample(long timestampMs, int rebufferCount, long totalBufferingMs) {
            this.timestampMs = timestampMs;
            this.rebufferCount = rebufferCount;
            this.totalBufferingMs = totalBufferingMs;
        }
    }

    private static final class ProfileDecision {
        final WxmBufferProfile profile;
        final WxmBufferDecisionReason reason;

        ProfileDecision(WxmBufferProfile profile, WxmBufferDecisionReason reason) {
            this.profile = profile;
            this.reason = reason;
        }
    }
}
