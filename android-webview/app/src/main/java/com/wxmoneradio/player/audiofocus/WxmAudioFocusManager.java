package com.wxmoneradio.player.audiofocus;

import android.content.Context;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;

public final class WxmAudioFocusManager {
    public interface Callback {
        void onAudioFocusGained();
        void onAudioFocusLostTransient();
        void onAudioFocusLostPermanent();
        void onAudioFocusDuck();
    }

    private final AudioManager audioManager;
    private final Callback callback;
    private AudioFocusRequest focusRequest;
    private final AudioManager.OnAudioFocusChangeListener focusChangeListener;

    public WxmAudioFocusManager(Context context, Callback callback) {
        this.audioManager = (AudioManager) context.getApplicationContext()
                .getSystemService(Context.AUDIO_SERVICE);
        this.callback = callback;
        this.focusChangeListener = focusChange -> {
            if (this.callback == null) {
                return;
            }
            if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
                this.callback.onAudioFocusGained();
            } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                this.callback.onAudioFocusLostTransient();
            } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
                this.callback.onAudioFocusLostPermanent();
            } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
                this.callback.onAudioFocusDuck();
            }
        };
    }

    public boolean requestPlaybackFocus() {
        if (audioManager == null) {
            return true;
        }
        int result;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (focusRequest == null) {
                android.media.AudioAttributes attrs = new android.media.AudioAttributes.Builder()
                        .setUsage(android.media.AudioAttributes.USAGE_MEDIA)
                        .setContentType(android.media.AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build();
                focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                        .setAudioAttributes(attrs)
                        .setOnAudioFocusChangeListener(focusChangeListener)
                        .setWillPauseWhenDucked(false)
                        .build();
            }
            result = audioManager.requestAudioFocus(focusRequest);
        } else {
            result = audioManager.requestAudioFocus(
                    focusChangeListener,
                    AudioManager.STREAM_MUSIC,
                    AudioManager.AUDIOFOCUS_GAIN);
        }
        return result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    }

    public void abandonFocus() {
        if (audioManager == null) {
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) {
            audioManager.abandonAudioFocusRequest(focusRequest);
        } else {
            audioManager.abandonAudioFocus(focusChangeListener);
        }
    }
}
