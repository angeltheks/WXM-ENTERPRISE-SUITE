package com.wxmoneradio.player.routes;

import android.content.Context;
import android.media.AudioDeviceCallback;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;

public final class WxmAudioRouteManager {
    public interface Callback {
        void onRouteChanged(RouteSnapshot snapshot);
    }

    public enum RouteType {
        SPEAKER,
        WIRED_HEADSET,
        BLUETOOTH,
        USB,
        HDMI,
        HEARING_AID,
        UNKNOWN
    }

    private final AudioManager audioManager;
    private AudioDeviceCallback deviceCallback;

    public WxmAudioRouteManager(Context context) {
        audioManager = (AudioManager) context.getApplicationContext().getSystemService(Context.AUDIO_SERVICE);
    }

    public void start(Handler handler, Callback callback) {
        if (audioManager == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.M || deviceCallback != null) {
            return;
        }
        deviceCallback = new AudioDeviceCallback() {
            @Override
            public void onAudioDevicesAdded(AudioDeviceInfo[] addedDevices) {
                if (callback != null) {
                    callback.onRouteChanged(snapshot());
                }
            }

            @Override
            public void onAudioDevicesRemoved(AudioDeviceInfo[] removedDevices) {
                if (callback != null) {
                    callback.onRouteChanged(snapshot());
                }
            }
        };
        audioManager.registerAudioDeviceCallback(deviceCallback, handler);
    }

    public void stop() {
        if (audioManager == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.M || deviceCallback == null) {
            return;
        }
        audioManager.unregisterAudioDeviceCallback(deviceCallback);
        deviceCallback = null;
    }

    public RouteSnapshot snapshot() {
        if (audioManager == null) {
            return new RouteSnapshot(RouteType.UNKNOWN, "Salida desconocida", false);
        }
        try {
            AudioDeviceInfo[] outputs = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
            RouteSnapshot best = null;
            for (AudioDeviceInfo device : outputs) {
                RouteSnapshot candidate = classify(device);
                if (candidate != null && isBetter(candidate, best)) {
                    best = candidate;
                }
            }
            if (best != null) {
                return best;
            }
        } catch (Exception ignored) {
        }
        return new RouteSnapshot(RouteType.SPEAKER, "Altavoz del telefono", false);
    }

    private boolean isBetter(RouteSnapshot candidate, RouteSnapshot current) {
        if (current == null) {
            return true;
        }
        return priority(candidate.type) > priority(current.type);
    }

    private int priority(RouteType type) {
        switch (type) {
            case WIRED_HEADSET:
            case BLUETOOTH:
            case USB:
            case HDMI:
                return 3;
            case HEARING_AID:
                return 2;
            case SPEAKER:
                return 1;
            default:
                return 0;
        }
    }

    private RouteSnapshot classify(AudioDeviceInfo device) {
        int type = device.getType();
        if (type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES || type == AudioDeviceInfo.TYPE_WIRED_HEADSET) {
            return new RouteSnapshot(RouteType.WIRED_HEADSET, "Audifonos cableados", true);
        }
        if (type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP || type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO) {
            return new RouteSnapshot(RouteType.BLUETOOTH, "Bluetooth audio", true);
        }
        if (type == AudioDeviceInfo.TYPE_USB_HEADSET || type == AudioDeviceInfo.TYPE_USB_DEVICE) {
            return new RouteSnapshot(RouteType.USB, "Audio USB", true);
        }
        if (type == AudioDeviceInfo.TYPE_HDMI) {
            return new RouteSnapshot(RouteType.HDMI, "HDMI / salida externa", true);
        }
        if (type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) {
            return new RouteSnapshot(RouteType.SPEAKER, "Altavoz del telefono", false);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                && (type == AudioDeviceInfo.TYPE_BLE_HEADSET
                || type == AudioDeviceInfo.TYPE_BLE_SPEAKER
                || type == AudioDeviceInfo.TYPE_HEARING_AID)) {
            RouteType routeType = type == AudioDeviceInfo.TYPE_HEARING_AID
                    ? RouteType.HEARING_AID
                    : RouteType.BLUETOOTH;
            return new RouteSnapshot(routeType, "Bluetooth LE audio", true);
        }
        return null;
    }

    public static final class RouteSnapshot {
        public final RouteType type;
        public final String label;
        public final boolean immersiveRecommended;

        private RouteSnapshot(RouteType type, String label, boolean immersiveRecommended) {
            this.type = type;
            this.label = label;
            this.immersiveRecommended = immersiveRecommended;
        }
    }
}
