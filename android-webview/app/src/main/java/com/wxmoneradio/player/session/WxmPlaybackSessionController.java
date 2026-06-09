package com.wxmoneradio.player.session;

import android.graphics.Bitmap;
import android.media.session.MediaSession;

import androidx.annotation.Nullable;

public interface WxmPlaybackSessionController {
    @Nullable
    MediaSession.Token getPlatformSessionToken();

    void update(String title, String artist, @Nullable String coverUrl,
                @Nullable Bitmap artwork, boolean playing);

    void release();
}
