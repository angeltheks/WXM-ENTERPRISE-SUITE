package com.wxmoneradio.player.artwork;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

import androidx.annotation.Nullable;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class WxmArtworkLoader {
    public interface Callback {
        void onArtworkLoaded(@Nullable Bitmap bitmap);
    }

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public void loadHttpsArtwork(@Nullable String coverUrl, Callback callback) {
        if (callback == null) {
            return;
        }
        if (coverUrl == null || !coverUrl.startsWith("https://")) {
            callback.onArtworkLoaded(null);
            return;
        }
        executor.execute(() -> callback.onArtworkLoaded(downloadBitmap(coverUrl)));
    }

    public void shutdown() {
        executor.shutdownNow();
    }

    @Nullable
    private Bitmap downloadBitmap(String imageUrl) {
        HttpURLConnection connection = null;
        try {
            URL url = new URL(imageUrl);
            connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(7000);
            connection.setInstanceFollowRedirects(false);
            if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
                return null;
            }
            String contentType = connection.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return null;
            }
            try (InputStream stream = connection.getInputStream()) {
                return BitmapFactory.decodeStream(stream);
            }
        } catch (Exception ignored) {
            return null;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
}
