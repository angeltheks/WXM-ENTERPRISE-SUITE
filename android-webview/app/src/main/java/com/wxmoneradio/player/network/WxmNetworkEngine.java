package com.wxmoneradio.player.network;

import androidx.media3.exoplayer.source.MediaSource;

import com.wxmoneradio.player.telemetry.WxmPlaybackTelemetry;

import okhttp3.OkHttpClient;

public final class WxmNetworkEngine {
    private final WxmNetworkConfig config;
    private final OkHttpClient okHttpClient;
    private final WxmDataSourceFactory dataSourceFactory;

    public WxmNetworkEngine(WxmNetworkConfig config, WxmPlaybackTelemetry telemetry) {
        this.config = config == null ? WxmNetworkConfig.radioDefault() : config;
        this.okHttpClient = WxmOkHttpClientFactory.create(this.config, telemetry);
        this.dataSourceFactory = new WxmDataSourceFactory(this.config, telemetry, okHttpClient);
    }

    public MediaSource.Factory createMediaSourceFactory() {
        return dataSourceFactory.createMediaSourceFactory();
    }

    public WxmNetworkConfig getConfig() {
        return config;
    }

    public OkHttpClient getOkHttpClient() {
        return okHttpClient;
    }
}
