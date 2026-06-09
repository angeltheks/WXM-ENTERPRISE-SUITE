package com.wxmoneradio.player.engine;

import android.os.SystemClock;

import androidx.annotation.Nullable;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class WxmFallbackManager {
    private final List<WxmStreamSource> configuredSources;
    private final List<WxmStreamSource> runtimeSources = new ArrayList<>();
    private final Map<String, SourceState> sourceStates = new LinkedHashMap<>();
    private final WxmFallbackPolicy policy;
    private int currentIndex;
    private long lastPrimaryRecoveryAttemptAtElapsedMs;

    public WxmFallbackManager(List<WxmStreamSource> configuredSources) {
        this(configuredSources, WxmFallbackPolicy.radioDefault());
    }

    public WxmFallbackManager(List<WxmStreamSource> configuredSources, WxmFallbackPolicy policy) {
        this.configuredSources = sanitizeSources(configuredSources);
        this.policy = policy == null ? WxmFallbackPolicy.radioDefault() : policy;
        runtimeSources.addAll(this.configuredSources);
        resetSourceStates();
    }

    public synchronized void setRuntimePrimary(String url) {
        if (url == null || url.trim().isEmpty()) {
            return;
        }
        WxmStreamSource runtimePrimary = new WxmStreamSource("runtime_primary", url.trim(), 0, true);
        if (!runtimePrimary.isSecureHttps()) {
            return;
        }
        runtimeSources.clear();
        runtimeSources.add(runtimePrimary);
        for (WxmStreamSource source : configuredSources) {
            if (!runtimePrimary.getUrl().equals(source.getUrl())) {
                runtimeSources.add(source);
            }
        }
        currentIndex = 0;
        resetSourceStates();
    }

    @Nullable
    public synchronized WxmStreamSource getCurrentSource() {
        return runtimeSources.isEmpty() ? null : runtimeSources.get(currentIndex);
    }

    public synchronized boolean moveToNextFallback() {
        long nowWall = System.currentTimeMillis();
        long nowElapsed = SystemClock.elapsedRealtime();
        recordFailureForCurrent(nowWall, nowElapsed);
        int nextIndex = findBestEligibleFallbackIndex(nowElapsed);
        if (nextIndex < 0) {
            return false;
        }
        currentIndex = nextIndex;
        markCurrentHealth(WxmStreamHealth.RECOVERING, nowWall, nowElapsed);
        return true;
    }

    public synchronized boolean tryRecoverPrimary() {
        long nowWall = System.currentTimeMillis();
        long nowElapsed = SystemClock.elapsedRealtime();
        int primaryIndex = findPrimaryIndex();
        if (primaryIndex < 0) {
            return false;
        }
        if (nowElapsed - lastPrimaryRecoveryAttemptAtElapsedMs < policy.getMinimumPrimaryRecoveryIntervalMs()) {
            return false;
        }
        SourceState primaryState = stateFor(runtimeSources.get(primaryIndex));
        if (!isEligible(primaryState, nowElapsed)) {
            return false;
        }
        lastPrimaryRecoveryAttemptAtElapsedMs = nowElapsed;
        currentIndex = primaryIndex;
        markCurrentHealth(WxmStreamHealth.RECOVERING, nowWall, nowElapsed);
        return true;
    }

    public synchronized void beginNewFallbackRound() {
        currentIndex = 0;
        lastPrimaryRecoveryAttemptAtElapsedMs = 0L;
        resetSourceStates();
    }

    public synchronized boolean hasFallbackAvailable() {
        return findBestEligibleFallbackIndex(SystemClock.elapsedRealtime()) >= 0;
    }

    public synchronized boolean hasConfiguredFallbacks() {
        return runtimeSources.size() > 1;
    }

    public synchronized boolean allSourcesExhausted() {
        if (runtimeSources.isEmpty()) {
            return false;
        }
        long nowElapsed = SystemClock.elapsedRealtime();
        for (WxmStreamSource source : runtimeSources) {
            SourceState state = stateFor(source);
            if (state.health != WxmStreamHealth.FAILED || isEligible(state, nowElapsed)) {
                return false;
            }
        }
        return true;
    }

    public synchronized boolean allSourcesUnavailableNow() {
        if (runtimeSources.isEmpty()) {
            return false;
        }
        long nowElapsed = SystemClock.elapsedRealtime();
        for (WxmStreamSource source : runtimeSources) {
            if (isEligible(stateFor(source), nowElapsed)) {
                return false;
            }
        }
        return true;
    }

    public synchronized int getCurrentIndex() {
        return currentIndex;
    }

    public synchronized int getSourceCount() {
        return runtimeSources.size();
    }

    public synchronized int getFallbackCount() {
        return Math.max(0, runtimeSources.size() - 1);
    }

    public synchronized WxmStreamHealth getCurrentHealth() {
        WxmStreamSource current = getCurrentSource();
        return current == null ? WxmStreamHealth.UNKNOWN : stateFor(current).health;
    }

    public synchronized Map<String, WxmStreamHealth> getSourceHealthSnapshot() {
        Map<String, WxmStreamHealth> snapshot = new LinkedHashMap<>();
        for (WxmStreamSource source : runtimeSources) {
            snapshot.put(source.getId(), stateFor(source).health);
        }
        return Collections.unmodifiableMap(snapshot);
    }

    public synchronized List<SourceSnapshot> getSourceSnapshots() {
        long nowElapsed = SystemClock.elapsedRealtime();
        List<SourceSnapshot> snapshots = new ArrayList<>();
        for (int i = 0; i < runtimeSources.size(); i++) {
            WxmStreamSource source = runtimeSources.get(i);
            SourceState state = stateFor(source);
            snapshots.add(new SourceSnapshot(
                    source.getId(),
                    source.getPriority(),
                    source.isPrimary(),
                    i == currentIndex,
                    state.health,
                    state.totalFailures,
                    state.consecutiveFailures,
                    state.lastFailureAtMs,
                    state.lastHealthyAtMs,
                    isEligible(state, nowElapsed),
                    remainingMs(state.cooldownUntilElapsedMs, nowElapsed),
                    remainingMs(state.quarantineUntilElapsedMs, nowElapsed)
            ));
        }
        return Collections.unmodifiableList(snapshots);
    }

    public synchronized void markHealth(WxmStreamHealth health) {
        markCurrentHealth(
                health == null ? WxmStreamHealth.UNKNOWN : health,
                System.currentTimeMillis(),
                SystemClock.elapsedRealtime()
        );
    }

    private void markCurrentHealth(WxmStreamHealth health, long nowWall, long nowElapsed) {
        WxmStreamSource current = getCurrentSource();
        if (current == null) {
            return;
        }
        SourceState state = stateFor(current);
        state.health = health;
        if (health == WxmStreamHealth.HEALTHY) {
            state.consecutiveFailures = 0;
            state.cooldownUntilElapsedMs = 0L;
            state.quarantineUntilElapsedMs = 0L;
            state.lastHealthyAtMs = nowWall;
        }
    }

    private void recordFailureForCurrent(long nowWall, long nowElapsed) {
        WxmStreamSource current = getCurrentSource();
        if (current == null) {
            return;
        }
        SourceState state = stateFor(current);
        state.health = WxmStreamHealth.FAILED;
        state.totalFailures++;
        state.consecutiveFailures++;
        state.lastFailureAtMs = nowWall;
        state.cooldownUntilElapsedMs = nowElapsed + policy.getSourceCooldownMs();
        if (state.consecutiveFailures >= policy.getQuarantineAfterConsecutiveFailures()) {
            state.quarantineUntilElapsedMs = nowElapsed + policy.getQuarantineDurationMs();
        }
    }

    private int findBestEligibleFallbackIndex(long now) {
        List<Integer> candidates = new ArrayList<>();
        for (int i = 0; i < runtimeSources.size(); i++) {
            WxmStreamSource source = runtimeSources.get(i);
            if (i == currentIndex || source.isPrimary()) {
                continue;
            }
            if (isEligible(stateFor(source), now)) {
                candidates.add(i);
            }
        }
        if (candidates.isEmpty()) {
            return -1;
        }
        Collections.sort(candidates, (left, right) -> {
            WxmStreamSource leftSource = runtimeSources.get(left);
            WxmStreamSource rightSource = runtimeSources.get(right);
            SourceState leftState = stateFor(leftSource);
            SourceState rightState = stateFor(rightSource);
            int healthCompare = Integer.compare(healthRank(leftState.health), healthRank(rightState.health));
            if (healthCompare != 0) {
                return healthCompare;
            }
            int priorityCompare = Integer.compare(leftSource.getPriority(), rightSource.getPriority());
            if (priorityCompare != 0) {
                return priorityCompare;
            }
            return Integer.compare(leftState.totalFailures, rightState.totalFailures);
        });
        return candidates.get(0);
    }

    private boolean isEligible(SourceState state, long now) {
        return state.cooldownUntilElapsedMs <= now && state.quarantineUntilElapsedMs <= now;
    }

    private int findPrimaryIndex() {
        for (int i = 0; i < runtimeSources.size(); i++) {
            if (runtimeSources.get(i).isPrimary()) {
                return i;
            }
        }
        return runtimeSources.isEmpty() ? -1 : 0;
    }

    private int healthRank(WxmStreamHealth health) {
        switch (health) {
            case HEALTHY:
                return 0;
            case UNKNOWN:
                return 1;
            case DEGRADED:
            case BUFFERING:
            case RECOVERING:
                return 2;
            case FAILED:
            default:
                return 3;
        }
    }

    private long remainingMs(long deadlineMs, long now) {
        return deadlineMs <= now ? 0L : deadlineMs - now;
    }

    private SourceState stateFor(WxmStreamSource source) {
        SourceState state = sourceStates.get(source.getId());
        if (state == null) {
            state = new SourceState();
            sourceStates.put(source.getId(), state);
        }
        return state;
    }

    private void resetSourceStates() {
        sourceStates.clear();
        for (WxmStreamSource source : runtimeSources) {
            sourceStates.put(source.getId(), new SourceState());
        }
    }

    private List<WxmStreamSource> sanitizeSources(List<WxmStreamSource> candidates) {
        List<WxmStreamSource> safeSources = new ArrayList<>();
        if (candidates == null) {
            return safeSources;
        }
        Map<String, WxmStreamSource> deduplicatedByUrl = new LinkedHashMap<>();
        for (WxmStreamSource source : candidates) {
            if (source == null || !source.isSecureHttps()) {
                continue;
            }
            deduplicatedByUrl.putIfAbsent(source.getUrl(), source);
        }
        safeSources.addAll(deduplicatedByUrl.values());
        Collections.sort(safeSources, Comparator.comparingInt(WxmStreamSource::getPriority));
        return safeSources;
    }

    private static final class SourceState {
        WxmStreamHealth health = WxmStreamHealth.UNKNOWN;
        int totalFailures;
        int consecutiveFailures;
        long lastFailureAtMs;
        long lastHealthyAtMs;
        long cooldownUntilElapsedMs;
        long quarantineUntilElapsedMs;
    }

    public static final class SourceSnapshot {
        public final String id;
        public final int priority;
        public final boolean primary;
        public final boolean active;
        public final WxmStreamHealth health;
        public final int totalFailures;
        public final int consecutiveFailures;
        public final long lastFailureAtMs;
        public final long lastHealthyAtMs;
        public final boolean eligible;
        public final long cooldownRemainingMs;
        public final long quarantineRemainingMs;

        private SourceSnapshot(String id, int priority, boolean primary, boolean active,
                               WxmStreamHealth health, int totalFailures, int consecutiveFailures,
                               long lastFailureAtMs, long lastHealthyAtMs, boolean eligible,
                               long cooldownRemainingMs, long quarantineRemainingMs) {
            this.id = id;
            this.priority = priority;
            this.primary = primary;
            this.active = active;
            this.health = health;
            this.totalFailures = totalFailures;
            this.consecutiveFailures = consecutiveFailures;
            this.lastFailureAtMs = lastFailureAtMs;
            this.lastHealthyAtMs = lastHealthyAtMs;
            this.eligible = eligible;
            this.cooldownRemainingMs = cooldownRemainingMs;
            this.quarantineRemainingMs = quarantineRemainingMs;
        }
    }
}
