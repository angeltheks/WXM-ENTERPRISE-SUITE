package com.wxmoneradio.player.commands;

import android.content.Intent;

import androidx.annotation.Nullable;

import com.wxmoneradio.player.RadioPlaybackService;

public final class WxmPlaybackCommand {
    public enum Type {
        PLAY,
        PAUSE,
        STOP,
        RECONNECT,
        METADATA,
        AUDIO_PROFILE,
        VOLUME
    }

    public final Type type;
    @Nullable public final String streamUrl;
    @Nullable public final String title;
    @Nullable public final String artist;
    @Nullable public final String coverUrl;
    @Nullable public final String audioProfile;
    public final boolean hasVolume;
    public final float volume;
    public final boolean hasMuted;
    public final boolean muted;

    private WxmPlaybackCommand(Type type, @Nullable String streamUrl, @Nullable String title,
                               @Nullable String artist, @Nullable String coverUrl,
                               @Nullable String audioProfile, boolean hasVolume, float volume,
                               boolean hasMuted, boolean muted) {
        this.type = type;
        this.streamUrl = streamUrl;
        this.title = title;
        this.artist = artist;
        this.coverUrl = coverUrl;
        this.audioProfile = audioProfile;
        this.hasVolume = hasVolume;
        this.volume = volume;
        this.hasMuted = hasMuted;
        this.muted = muted;
    }

    public static WxmPlaybackCommand from(@Nullable Intent intent, float currentVolume, boolean currentMuted) {
        String action = intent != null ? intent.getAction() : RadioPlaybackService.ACTION_PLAY;
        Type type = resolveType(action);
        String streamUrl = intent != null ? intent.getStringExtra(RadioPlaybackService.EXTRA_STREAM_URL) : null;
        String title = intent != null ? intent.getStringExtra(RadioPlaybackService.EXTRA_TITLE) : null;
        String artist = intent != null ? intent.getStringExtra(RadioPlaybackService.EXTRA_ARTIST) : null;
        String coverUrl = intent != null ? intent.getStringExtra(RadioPlaybackService.EXTRA_COVER) : null;
        String audioProfile = intent != null ? intent.getStringExtra(RadioPlaybackService.EXTRA_AUDIO_PROFILE) : null;
        boolean hasVolume = intent != null && intent.hasExtra(RadioPlaybackService.EXTRA_VOLUME);
        float volume = hasVolume ? intent.getFloatExtra(RadioPlaybackService.EXTRA_VOLUME, currentVolume) : currentVolume;
        boolean hasMuted = intent != null && intent.hasExtra(RadioPlaybackService.EXTRA_MUTED);
        boolean muted = hasMuted ? intent.getBooleanExtra(RadioPlaybackService.EXTRA_MUTED, currentMuted) : currentMuted;
        return new WxmPlaybackCommand(type, streamUrl, title, artist, coverUrl, audioProfile,
                hasVolume, volume, hasMuted, muted);
    }

    private static Type resolveType(@Nullable String action) {
        if (RadioPlaybackService.ACTION_STOP.equals(action)) {
            return Type.STOP;
        }
        if (RadioPlaybackService.ACTION_RECONNECT.equals(action)) {
            return Type.RECONNECT;
        }
        if (RadioPlaybackService.ACTION_METADATA.equals(action)) {
            return Type.METADATA;
        }
        if (RadioPlaybackService.ACTION_AUDIO_PROFILE.equals(action)) {
            return Type.AUDIO_PROFILE;
        }
        if (RadioPlaybackService.ACTION_VOLUME.equals(action)) {
            return Type.VOLUME;
        }
        if (RadioPlaybackService.ACTION_PAUSE.equals(action)) {
            return Type.PAUSE;
        }
        return Type.PLAY;
    }
}
