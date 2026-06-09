package com.wxmoneradio.player.network;

import androidx.media3.datasource.DataSource;
import androidx.media3.datasource.DataSpec;
import androidx.media3.datasource.TransferListener;
import androidx.media3.datasource.okhttp.OkHttpDataSource;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.exoplayer.source.MediaSource;

import com.wxmoneradio.player.telemetry.WxmPlaybackTelemetry;

import okhttp3.OkHttpClient;

public final class WxmDataSourceFactory {
    private final WxmNetworkConfig config;
    private final WxmPlaybackTelemetry telemetry;
    private final OkHttpClient okHttpClient;

    public WxmDataSourceFactory(WxmNetworkConfig config, WxmPlaybackTelemetry telemetry, OkHttpClient okHttpClient) {
        this.config = config == null ? WxmNetworkConfig.radioDefault() : config;
        this.telemetry = telemetry;
        this.okHttpClient = okHttpClient;
    }

    public DataSource.Factory createHttpDataSourceFactory() {
        return new OkHttpDataSource.Factory(okHttpClient)
                .setUserAgent(config.getUserAgent())
                .setDefaultRequestProperties(config.getRequestHeaders())
                .setTransferListener(new TransferListener() {
                    @Override
                    public void onTransferInitializing(DataSource source, DataSpec dataSpec, boolean isNetwork) {
                    }

                    @Override
                    public void onTransferStart(DataSource source, DataSpec dataSpec, boolean isNetwork) {
                    }

                    @Override
                    public void onBytesTransferred(DataSource source, DataSpec dataSpec, boolean isNetwork, int bytesTransferred) {
                        if (isNetwork && telemetry != null) {
                            telemetry.recordNetworkBytes(bytesTransferred);
                        }
                    }

                    @Override
                    public void onTransferEnd(DataSource source, DataSpec dataSpec, boolean isNetwork) {
                    }
                });
    }

    public MediaSource.Factory createMediaSourceFactory() {
        return new DefaultMediaSourceFactory(createHttpDataSourceFactory());
    }
}
