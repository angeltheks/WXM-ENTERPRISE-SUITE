package com.wxmoneradio.player.engine;

public final class WxmStreamSnapshot {
    public final WxmStreamLifecycleState lifecycleState;
    public final String activeStreamId;
    public final String activeStreamUrl;
    public final boolean activeStreamSecure;
    public final long lastTransitionAtMs;
    public final String lastTransitionReason;
    public final int rejectedRuntimePrimaryCount;

    public WxmStreamSnapshot(WxmStreamLifecycleState lifecycleState,
                             String activeStreamId,
                             String activeStreamUrl,
                             boolean activeStreamSecure,
                             long lastTransitionAtMs,
                             String lastTransitionReason,
                             int rejectedRuntimePrimaryCount) {
        this.lifecycleState = lifecycleState;
        this.activeStreamId = activeStreamId;
        this.activeStreamUrl = activeStreamUrl;
        this.activeStreamSecure = activeStreamSecure;
        this.lastTransitionAtMs = lastTransitionAtMs;
        this.lastTransitionReason = lastTransitionReason;
        this.rejectedRuntimePrimaryCount = rejectedRuntimePrimaryCount;
    }
}
