package com.wxmoneradio.player.engine;

public final class WxmStreamSource {
    private final String id;
    private final String url;
    private final int priority;
    private final boolean primary;

    public WxmStreamSource(String id, String url, int priority, boolean primary) {
        this.id = id;
        this.url = url;
        this.priority = priority;
        this.primary = primary;
    }

    public String getId() {
        return id;
    }

    public String getUrl() {
        return url;
    }

    public int getPriority() {
        return priority;
    }

    public boolean isPrimary() {
        return primary;
    }

    public boolean isSecureHttps() {
        return new WxmStreamUrlPolicy().accepts(url);
    }
}
