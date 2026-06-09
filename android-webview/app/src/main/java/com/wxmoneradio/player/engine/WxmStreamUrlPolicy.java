package com.wxmoneradio.player.engine;

import android.net.Uri;

import androidx.annotation.Nullable;

public final class WxmStreamUrlPolicy {
    @Nullable
    public String sanitize(@Nullable String rawUrl) {
        if (rawUrl == null) {
            return null;
        }
        String candidate = rawUrl.trim();
        if (candidate.isEmpty()) {
            return null;
        }
        Uri uri = Uri.parse(candidate);
        if (!"https".equalsIgnoreCase(uri.getScheme())
                || uri.getHost() == null
                || uri.getHost().trim().isEmpty()
                || uri.getUserInfo() != null
                || uri.getFragment() != null) {
            return null;
        }
        return uri.toString();
    }

    public boolean accepts(@Nullable String rawUrl) {
        return sanitize(rawUrl) != null;
    }
}
