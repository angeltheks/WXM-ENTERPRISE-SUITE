package com.wxmoneradio.player.spatial;

import android.content.Context;
import android.media.AudioManager;
import android.os.Build;

public final class WxmSpatialCapabilities {
    private final AudioManager audioManager;

    public WxmSpatialCapabilities(Context context) {
        audioManager = (AudioManager) context.getApplicationContext().getSystemService(Context.AUDIO_SERVICE);
    }

    public SpatialSnapshot snapshot() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || audioManager == null) {
            return new SpatialSnapshot(false, false, false, "No disponible en esta version de Android");
        }
        try {
            android.media.Spatializer spatializer = audioManager.getSpatializer();
            boolean available = spatializer != null && spatializer.isAvailable();
            boolean enabled = spatializer != null && spatializer.isEnabled();
            return new SpatialSnapshot(true, available, enabled,
                    available ? "Spatializer Android disponible" : "Dispositivo sin Spatializer activo");
        } catch (Exception ignored) {
            return new SpatialSnapshot(true, false, false, "Spatializer no accesible");
        }
    }

    public static final class SpatialSnapshot {
        public final boolean apiSupported;
        public final boolean available;
        public final boolean enabled;
        public final String label;

        private SpatialSnapshot(boolean apiSupported, boolean available, boolean enabled, String label) {
            this.apiSupported = apiSupported;
            this.available = available;
            this.enabled = enabled;
            this.label = label;
        }
    }
}
