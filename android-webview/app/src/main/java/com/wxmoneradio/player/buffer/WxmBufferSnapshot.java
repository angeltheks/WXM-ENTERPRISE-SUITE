package com.wxmoneradio.player.buffer;

public final class WxmBufferSnapshot {
    public final WxmBufferProfile activeProfile;
    public final WxmBufferProfile recommendedProfile;
    public final WxmBufferHealth health;
    public final WxmBufferDecisionReason reason;
    public final boolean pendingProfileChange;
    public final int recentRebufferCount;
    public final long recentBufferingMs;
    public final int appliedProfileChangeCount;
    public final long activeProfileAppliedAtMs;
    public final long evaluatedAtMs;
    public final long deescalationHoldRemainingMs;
    public final boolean forced;

    public WxmBufferSnapshot(WxmBufferProfile activeProfile,
                             WxmBufferProfile recommendedProfile,
                             WxmBufferHealth health,
                             WxmBufferDecisionReason reason,
                             boolean pendingProfileChange,
                             int recentRebufferCount,
                             long recentBufferingMs,
                             int appliedProfileChangeCount,
                             long activeProfileAppliedAtMs,
                             long evaluatedAtMs,
                             long deescalationHoldRemainingMs,
                             boolean forced) {
        this.activeProfile = activeProfile;
        this.recommendedProfile = recommendedProfile;
        this.health = health;
        this.reason = reason;
        this.pendingProfileChange = pendingProfileChange;
        this.recentRebufferCount = recentRebufferCount;
        this.recentBufferingMs = recentBufferingMs;
        this.appliedProfileChangeCount = appliedProfileChangeCount;
        this.activeProfileAppliedAtMs = activeProfileAppliedAtMs;
        this.evaluatedAtMs = evaluatedAtMs;
        this.deescalationHoldRemainingMs = deescalationHoldRemainingMs;
        this.forced = forced;
    }
}
