package com.wxmoneradio.player;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.webkit.JavascriptInterface;

import com.wxmoneradio.player.bridge.WxmBridgeStatusStore;

public class AndroidAudioBridge {
    private final Context context;
    private String audioProfile = "standard";
    private float volume = 0.7f;
    private boolean muted;

    public AndroidAudioBridge(Context context) {
        this.context = context.getApplicationContext();
    }

    @JavascriptInterface
    public void play(String streamUrl, String profile, float requestedVolume, boolean requestedMuted) {
        audioProfile = profile == null ? audioProfile : profile;
        volume = Math.max(0f, Math.min(1f, requestedVolume));
        muted = requestedMuted;
        Intent intent = new Intent(context, RadioPlaybackService.class)
                .setAction(RadioPlaybackService.ACTION_PLAY)
                .putExtra(RadioPlaybackService.EXTRA_STREAM_URL, streamUrl)
                .putExtra(RadioPlaybackService.EXTRA_AUDIO_PROFILE, audioProfile)
                .putExtra(RadioPlaybackService.EXTRA_VOLUME, volume)
                .putExtra(RadioPlaybackService.EXTRA_MUTED, muted);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    @JavascriptInterface
    public void pause() {
        context.startService(new Intent(context, RadioPlaybackService.class)
                .setAction(RadioPlaybackService.ACTION_PAUSE));
    }

    @JavascriptInterface
    public void stop() {
        context.startService(new Intent(context, RadioPlaybackService.class)
                .setAction(RadioPlaybackService.ACTION_STOP));
    }

    @JavascriptInterface
    public void updateMetadata(String title, String artist, String cover) {
        context.startService(new Intent(context, RadioPlaybackService.class)
                .setAction(RadioPlaybackService.ACTION_METADATA)
                .putExtra(RadioPlaybackService.EXTRA_TITLE, title)
                .putExtra(RadioPlaybackService.EXTRA_ARTIST, artist)
                .putExtra(RadioPlaybackService.EXTRA_COVER, cover));
    }

    @JavascriptInterface
    public void setAudioProfile(String profile) {
        audioProfile = profile == null ? "standard" : profile;
        context.startService(new Intent(context, RadioPlaybackService.class)
                .setAction(RadioPlaybackService.ACTION_AUDIO_PROFILE)
                .putExtra(RadioPlaybackService.EXTRA_AUDIO_PROFILE, audioProfile));
    }

    @JavascriptInterface
    public void setVolume(float value) {
        volume = Math.max(0f, Math.min(1f, value));
        context.startService(new Intent(context, RadioPlaybackService.class)
                .setAction(RadioPlaybackService.ACTION_VOLUME)
                .putExtra(RadioPlaybackService.EXTRA_VOLUME, volume)
                .putExtra(RadioPlaybackService.EXTRA_MUTED, muted));
    }

    @JavascriptInterface
    public void setMuted(boolean value) {
        muted = value;
        context.startService(new Intent(context, RadioPlaybackService.class)
                .setAction(RadioPlaybackService.ACTION_VOLUME)
                .putExtra(RadioPlaybackService.EXTRA_VOLUME, volume)
                .putExtra(RadioPlaybackService.EXTRA_MUTED, muted));
    }

    @JavascriptInterface
    public String getPlaybackStatus() {
        return WxmBridgeStatusStore.getJson();
    }
}
