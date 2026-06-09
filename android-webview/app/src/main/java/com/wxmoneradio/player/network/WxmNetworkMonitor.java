package com.wxmoneradio.player.network;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.os.Build;

public final class WxmNetworkMonitor {
    private final ConnectivityManager connectivityManager;
    private volatile WxmNetworkSnapshot lastSnapshot = new WxmNetworkSnapshot(
            WxmNetworkScore.ACCEPTABLE,
            WxmNetworkScore.ACCEPTABLE,
            true,
            true,
            false,
            "unknown",
            0,
            System.currentTimeMillis(),
            0L,
            0L,
            0L,
            0L
    );
    private long networkChangeCount;
    private long lastChangedAtMs;
    private long lastConnectedAtMs;
    private long lastDisconnectedAtMs;
    private ConnectivityManager.NetworkCallback networkCallback;

    public WxmNetworkMonitor(Context context) {
        connectivityManager = (ConnectivityManager) context.getApplicationContext()
                .getSystemService(Context.CONNECTIVITY_SERVICE);
    }

    public void start() {
        refreshSnapshot();
        registerNetworkCallbackIfSupported();
    }

    public void stop() {
        if (connectivityManager != null && networkCallback != null) {
            try {
                connectivityManager.unregisterNetworkCallback(networkCallback);
            } catch (Exception ignored) {
            }
            networkCallback = null;
        }
    }

    public WxmNetworkScore getCurrentScore() {
        refreshSnapshot();
        return lastSnapshot.score;
    }

    public WxmNetworkScore getLastScore() {
        return lastSnapshot.score;
    }

    public WxmNetworkSnapshot getSnapshot() {
        refreshSnapshot();
        return lastSnapshot;
    }

    private void registerNetworkCallbackIfSupported() {
        if (connectivityManager == null || networkCallback != null) {
            return;
        }
        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                refreshSnapshot();
            }

            @Override
            public void onLost(Network network) {
                refreshSnapshot();
            }

            @Override
            public void onCapabilitiesChanged(Network network, NetworkCapabilities networkCapabilities) {
                refreshSnapshot();
            }
        };
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                connectivityManager.registerDefaultNetworkCallback(networkCallback);
            } else {
                NetworkRequest request = new NetworkRequest.Builder()
                        .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                        .build();
                connectivityManager.registerNetworkCallback(request, networkCallback);
            }
        } catch (Exception ignored) {
            networkCallback = null;
        }
    }

    private synchronized void refreshSnapshot() {
        WxmNetworkSnapshot previous = lastSnapshot;
        WxmNetworkSnapshot candidate = calculateSnapshot();
        boolean changed = hasMeaningfulChange(previous, candidate);
        long now = candidate.updatedAtMs;
        if (changed) {
            networkChangeCount++;
            lastChangedAtMs = now;
            if (candidate.connected) {
                lastConnectedAtMs = now;
            } else {
                lastDisconnectedAtMs = now;
            }
        }
        lastSnapshot = new WxmNetworkSnapshot(
                candidate.score,
                previous != null ? previous.score : candidate.score,
                candidate.connected,
                candidate.validated,
                candidate.metered,
                candidate.transport,
                candidate.downstreamKbps,
                candidate.updatedAtMs,
                networkChangeCount,
                lastChangedAtMs,
                lastConnectedAtMs,
                lastDisconnectedAtMs
        );
    }

    private WxmNetworkSnapshot calculateSnapshot() {
        if (connectivityManager == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return new WxmNetworkSnapshot(
                    WxmNetworkScore.ACCEPTABLE,
                    WxmNetworkScore.ACCEPTABLE,
                    true,
                    true,
                    false,
                    "legacy",
                    0,
                    System.currentTimeMillis(),
                    networkChangeCount,
                    lastChangedAtMs,
                    lastConnectedAtMs,
                    lastDisconnectedAtMs
            );
        }
        Network network = connectivityManager.getActiveNetwork();
        if (network == null) {
            return disconnectedSnapshot();
        }
        NetworkCapabilities caps = connectivityManager.getNetworkCapabilities(network);
        if (caps == null || !caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) {
            return disconnectedSnapshot();
        }
        boolean validated = caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
        int downKbps = caps.getLinkDownstreamBandwidthKbps();
        WxmNetworkScore score;
        if (!validated) {
            score = WxmNetworkScore.CRITICAL;
        } else if (downKbps >= 12000) {
            score = WxmNetworkScore.EXCELLENT;
        } else if (downKbps >= 3000 || caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
            score = WxmNetworkScore.GOOD;
        } else if (downKbps >= 700) {
            score = WxmNetworkScore.ACCEPTABLE;
        } else if (downKbps > 0) {
            score = WxmNetworkScore.POOR;
        } else if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
            score = WxmNetworkScore.ACCEPTABLE;
        } else {
            score = WxmNetworkScore.GOOD;
        }
        return new WxmNetworkSnapshot(
                score,
                score,
                true,
                validated,
                connectivityManager.isActiveNetworkMetered(),
                transportLabel(caps),
                downKbps,
                System.currentTimeMillis(),
                networkChangeCount,
                lastChangedAtMs,
                lastConnectedAtMs,
                lastDisconnectedAtMs
        );
    }

    private WxmNetworkSnapshot disconnectedSnapshot() {
        return new WxmNetworkSnapshot(
                WxmNetworkScore.OFFLINE,
                WxmNetworkScore.OFFLINE,
                false,
                false,
                false,
                "none",
                0,
                System.currentTimeMillis(),
                networkChangeCount,
                lastChangedAtMs,
                lastConnectedAtMs,
                lastDisconnectedAtMs
        );
    }

    private boolean hasMeaningfulChange(WxmNetworkSnapshot previous, WxmNetworkSnapshot next) {
        if (previous == null || next == null) {
            return true;
        }
        return previous.score != next.score
                || previous.connected != next.connected
                || previous.validated != next.validated
                || previous.metered != next.metered
                || !previous.transport.equals(next.transport);
    }

    private String transportLabel(NetworkCapabilities caps) {
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
            return "wifi";
        }
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
            return "cellular";
        }
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
            return "ethernet";
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI_AWARE)) {
            return "wifi_aware";
        }
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH)) {
            return "bluetooth";
        }
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) {
            return "vpn";
        }
        return "other";
    }
}
