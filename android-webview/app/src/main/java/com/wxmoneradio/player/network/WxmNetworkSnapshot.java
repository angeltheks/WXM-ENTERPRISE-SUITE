package com.wxmoneradio.player.network;

public final class WxmNetworkSnapshot {
    public final WxmNetworkScore score;
    public final WxmNetworkScore previousScore;
    public final boolean connected;
    public final boolean validated;
    public final boolean metered;
    public final String transport;
    public final int downstreamKbps;
    public final long updatedAtMs;
    public final long changeCount;
    public final long lastChangedAtMs;
    public final long lastConnectedAtMs;
    public final long lastDisconnectedAtMs;

    public WxmNetworkSnapshot(WxmNetworkScore score,
                              WxmNetworkScore previousScore,
                              boolean connected,
                              boolean validated,
                              boolean metered,
                              String transport,
                              int downstreamKbps,
                              long updatedAtMs,
                              long changeCount,
                              long lastChangedAtMs,
                              long lastConnectedAtMs,
                              long lastDisconnectedAtMs) {
        this.score = score;
        this.previousScore = previousScore;
        this.connected = connected;
        this.validated = validated;
        this.metered = metered;
        this.transport = transport;
        this.downstreamKbps = downstreamKbps;
        this.updatedAtMs = updatedAtMs;
        this.changeCount = changeCount;
        this.lastChangedAtMs = lastChangedAtMs;
        this.lastConnectedAtMs = lastConnectedAtMs;
        this.lastDisconnectedAtMs = lastDisconnectedAtMs;
    }
}
