package com.wxmoneradio.player.session;

import android.content.Context;
import android.graphics.Bitmap;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.Bundle;

import androidx.annotation.Nullable;

import com.wxmoneradio.player.R;

public final class WxmLegacyMediaSessionController implements WxmPlaybackSessionController {
    public interface Callback {
        void onPlay();
        void onPause();
        void onStop();
        void onReconnect();
    }

    private final MediaSession mediaSession;
    private final String reconnectAction;
    private final String stopAction;

    public WxmLegacyMediaSessionController(Context context, String reconnectAction,
                                           String stopAction, Callback callback) {
        this.reconnectAction = reconnectAction;
        this.stopAction = stopAction;
        mediaSession = new MediaSession(context, "WXM ONE RADIO");
        mediaSession.setCallback(new MediaSession.Callback() {
            @Override
            public void onPlay() {
                callback.onPlay();
            }

            @Override
            public void onPause() {
                callback.onPause();
            }

            @Override
            public void onStop() {
                callback.onStop();
            }

            @Override
            public void onCustomAction(String action, Bundle extras) {
                if (WxmLegacyMediaSessionController.this.reconnectAction.equals(action)) {
                    callback.onReconnect();
                    return;
                }
                if (WxmLegacyMediaSessionController.this.stopAction.equals(action)) {
                    callback.onStop();
                }
            }
        });
        mediaSession.setActive(true);
    }

    @Override
    public MediaSession.Token getPlatformSessionToken() {
        return mediaSession.getSessionToken();
    }

    @Override
    public void update(String title, String artist, @Nullable String coverUrl,
                       @Nullable Bitmap artwork, boolean playing) {
        MediaMetadata metadata = new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, title)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, artist)
                .putString(MediaMetadata.METADATA_KEY_ALBUM, "WXM ONE RADIO")
                .putString(MediaMetadata.METADATA_KEY_DISPLAY_TITLE, title)
                .putString(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE, artist)
                .putString(MediaMetadata.METADATA_KEY_DISPLAY_DESCRIPTION, "WXM ONE RADIO - En vivo")
                .putString(MediaMetadata.METADATA_KEY_ART_URI, coverUrl)
                .putString(MediaMetadata.METADATA_KEY_ALBUM_ART_URI, coverUrl)
                .putString(MediaMetadata.METADATA_KEY_DISPLAY_ICON_URI, coverUrl)
                .putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, artwork)
                .putBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON, artwork)
                .build();
        mediaSession.setMetadata(metadata);

        long actions = PlaybackState.ACTION_PLAY
                | PlaybackState.ACTION_PAUSE
                | PlaybackState.ACTION_PLAY_PAUSE
                | PlaybackState.ACTION_STOP;
        int state = playing ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED;
        PlaybackState.Builder playbackStateBuilder = new PlaybackState.Builder()
                .setActions(actions)
                .setState(state, PlaybackState.PLAYBACK_POSITION_UNKNOWN, playing ? 1f : 0f);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            playbackStateBuilder
                    .addCustomAction(new PlaybackState.CustomAction.Builder(
                            reconnectAction,
                            "Reconectar",
                            R.drawable.ic_notification_reconnect
                    ).build())
                    .addCustomAction(new PlaybackState.CustomAction.Builder(
                            stopAction,
                            "Detener",
                            R.drawable.ic_notification_stop
                    ).build());
        }
        mediaSession.setPlaybackState(playbackStateBuilder.build());
    }

    @Override
    public void release() {
        mediaSession.release();
    }
}
