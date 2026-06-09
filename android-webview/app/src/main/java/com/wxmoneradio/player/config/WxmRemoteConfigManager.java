package com.wxmoneradio.player.config;

import com.wxmoneradio.player.engine.WxmStreamSource;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class WxmRemoteConfigManager {
    private static final String DEFAULT_STREAM_URL = "https://jm8n.net:8024/stream";
    private static final List<String> DEFAULT_FALLBACK_STREAM_URLS = Collections.emptyList();

    public List<WxmStreamSource> loadStreamSources() {
        List<WxmStreamSource> sources = new ArrayList<>();
        sources.add(new WxmStreamSource("primary", DEFAULT_STREAM_URL, 0, true));
        int priority = 1;
        for (String fallbackUrl : DEFAULT_FALLBACK_STREAM_URLS) {
            sources.add(new WxmStreamSource("fallback_" + priority, fallbackUrl, priority, false));
            priority++;
        }
        return Collections.unmodifiableList(sources);
    }
}
