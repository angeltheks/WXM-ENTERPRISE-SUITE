package com.wxmoneradio.player.network;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public final class WxmNetworkConfig {
    private final String userAgent;
    private final int connectTimeoutMs;
    private final int readTimeoutMs;
    private final int writeTimeoutMs;
    private final int callTimeoutMs;
    private final boolean retryOnConnectionFailure;
    private final int maxIdleConnections;
    private final int keepAliveDurationMinutes;
    private final boolean allowCrossProtocolRedirects;
    private final boolean requestLoggingEnabled;
    private final Map<String, String> requestHeaders;

    private WxmNetworkConfig(String userAgent, int connectTimeoutMs, int readTimeoutMs,
                             int writeTimeoutMs, int callTimeoutMs,
                             boolean retryOnConnectionFailure, int maxIdleConnections,
                             int keepAliveDurationMinutes, boolean allowCrossProtocolRedirects,
                             boolean requestLoggingEnabled, Map<String, String> requestHeaders) {
        this.userAgent = userAgent;
        this.connectTimeoutMs = connectTimeoutMs;
        this.readTimeoutMs = readTimeoutMs;
        this.writeTimeoutMs = writeTimeoutMs;
        this.callTimeoutMs = callTimeoutMs;
        this.retryOnConnectionFailure = retryOnConnectionFailure;
        this.maxIdleConnections = maxIdleConnections;
        this.keepAliveDurationMinutes = keepAliveDurationMinutes;
        this.allowCrossProtocolRedirects = allowCrossProtocolRedirects;
        this.requestLoggingEnabled = requestLoggingEnabled;
        this.requestHeaders = Collections.unmodifiableMap(new HashMap<>(requestHeaders));
    }

    public static WxmNetworkConfig radioDefault() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Accept", "*/*");
        headers.put("Icy-MetaData", "1");
        headers.put("X-WXM-Client", "android-nextgen");
        return new WxmNetworkConfig(
                "WXM-ONE-RADIO-Android/1.1.1 Media3",
                9000,
                30000,
                16000,
                0,
                true,
                6,
                5,
                false,
                false,
                headers);
    }

    public String getUserAgent() {
        return userAgent;
    }

    public int getConnectTimeoutMs() {
        return connectTimeoutMs;
    }

    public int getReadTimeoutMs() {
        return readTimeoutMs;
    }

    public int getWriteTimeoutMs() {
        return writeTimeoutMs;
    }

    public int getCallTimeoutMs() {
        return callTimeoutMs;
    }

    public boolean isRetryOnConnectionFailure() {
        return retryOnConnectionFailure;
    }

    public int getMaxIdleConnections() {
        return maxIdleConnections;
    }

    public int getKeepAliveDurationMinutes() {
        return keepAliveDurationMinutes;
    }

    public boolean isAllowCrossProtocolRedirects() {
        return allowCrossProtocolRedirects;
    }

    public boolean isRequestLoggingEnabled() {
        return requestLoggingEnabled;
    }

    public Map<String, String> getRequestHeaders() {
        return requestHeaders;
    }
}
