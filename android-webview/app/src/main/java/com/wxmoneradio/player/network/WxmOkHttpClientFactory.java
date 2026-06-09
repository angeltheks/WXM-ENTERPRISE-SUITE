package com.wxmoneradio.player.network;

import com.wxmoneradio.player.telemetry.WxmPlaybackTelemetry;

import java.util.concurrent.TimeUnit;

import okhttp3.ConnectionPool;
import okhttp3.OkHttpClient;

public final class WxmOkHttpClientFactory {
    private WxmOkHttpClientFactory() {
    }

    public static OkHttpClient create(WxmNetworkConfig config, WxmPlaybackTelemetry telemetry) {
        WxmNetworkConfig safeConfig = config == null ? WxmNetworkConfig.radioDefault() : config;
        return new OkHttpClient.Builder()
                .connectTimeout(safeConfig.getConnectTimeoutMs(), TimeUnit.MILLISECONDS)
                .readTimeout(safeConfig.getReadTimeoutMs(), TimeUnit.MILLISECONDS)
                .writeTimeout(safeConfig.getWriteTimeoutMs(), TimeUnit.MILLISECONDS)
                .callTimeout(safeConfig.getCallTimeoutMs(), TimeUnit.MILLISECONDS)
                .retryOnConnectionFailure(safeConfig.isRetryOnConnectionFailure())
                .followRedirects(true)
                .followSslRedirects(safeConfig.isAllowCrossProtocolRedirects())
                .connectionPool(new ConnectionPool(
                        safeConfig.getMaxIdleConnections(),
                        safeConfig.getKeepAliveDurationMinutes(),
                        TimeUnit.MINUTES))
                .addInterceptor(new WxmHttpsOnlyInterceptor())
                .addInterceptor(new WxmSafeLoggingInterceptor(safeConfig.isRequestLoggingEnabled()))
                .eventListener(new WxmOkHttpEventListener(telemetry))
                .build();
    }
}
