package com.wxmoneradio.player.engine;

public enum WxmStreamLifecycleState {
    IDLE,
    CONFIGURED,
    STARTING,
    READY,
    PLAYING,
    PAUSED,
    BUFFERING,
    RETRYING,
    SWITCHING_FALLBACK,
    RECOVERING_PRIMARY,
    FAILED,
    STOPPED
}
