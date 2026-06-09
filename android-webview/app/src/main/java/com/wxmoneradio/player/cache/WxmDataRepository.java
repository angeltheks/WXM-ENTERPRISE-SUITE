package com.wxmoneradio.player.cache;

import android.content.Context;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.room.Room;

import com.wxmoneradio.player.engine.WxmStreamSource;
import com.wxmoneradio.player.telemetry.WxmPlaybackTelemetry;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class WxmDataRepository {
    private static final String TAG = "WxmDataRepository";
    private static final long TELEMETRY_MIN_INTERVAL_MS = 30000L;
    private static volatile WxmDataRepository instance;

    private final WxmDatabase database;
    private final ExecutorService ioExecutor = Executors.newSingleThreadExecutor();
    private volatile boolean roomReady = true;
    private volatile long lastAudioProfilePersistAtMs;
    private volatile long lastPlaybackStatePersistAtMs;
    private volatile long lastHistoryPersistAtMs;
    private volatile long lastTelemetryPersistAtMs;
    private volatile long streamConfigPersistCount;
    private volatile long persistenceFailureCount;
    private volatile long lastPersistenceFailureAtMs;
    private volatile String lastPersistenceFailure = "";

    private WxmDataRepository(Context context) {
        database = Room.databaseBuilder(
                context.getApplicationContext(),
                WxmDatabase.class,
                "wxm_nextgen.db"
        ).addMigrations(WxmDatabase.MIGRATION_1_2).build();
    }

    public static WxmDataRepository get(Context context) {
        if (instance == null) {
            synchronized (WxmDataRepository.class) {
                if (instance == null) {
                    instance = new WxmDataRepository(context);
                }
            }
        }
        return instance;
    }

    public void persistAudioProfile(String profileId, float volume, boolean muted) {
        long now = System.currentTimeMillis();
        ioExecutor.execute(() -> {
            try {
                database.audioProfileDao().upsert(new AudioProfileEntity(
                        "current",
                        sanitize(profileId, "standard"),
                        volume,
                        muted,
                        now
                ));
                lastAudioProfilePersistAtMs = now;
                recordPersistenceSuccess();
            } catch (Exception error) {
                recordPersistenceFailure("audio_profile", error);
            }
        });
    }

    public void persistPlaybackState(String state, @Nullable String streamId, boolean playing) {
        long now = System.currentTimeMillis();
        ioExecutor.execute(() -> {
            try {
                database.playbackStateDao().upsert(new PlaybackStateEntity(
                        "current",
                        sanitize(state, "unknown"),
                        streamId,
                        playing,
                        now
                ));
                lastPlaybackStatePersistAtMs = now;
                recordPersistenceSuccess();
            } catch (Exception error) {
                recordPersistenceFailure("playback_state", error);
            }
        });
    }

    public void persistHistoryTrack(String title, String artist, @Nullable String coverUrl) {
        String safeTitle = sanitize(title, "");
        String safeArtist = sanitize(artist, "");
        if (safeTitle.isEmpty() || safeArtist.isEmpty()) {
            return;
        }
        long now = System.currentTimeMillis();
        String key = safeTitle.toLowerCase(Locale.US) + "|" + safeArtist.toLowerCase(Locale.US);
        String dayKey = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date(now));
        ioExecutor.execute(() -> {
            try {
                database.historyDao().insert(new HistoryEntity(
                        key,
                        safeTitle,
                        safeArtist,
                        coverUrl,
                        now,
                        dayKey
                ));
                lastHistoryPersistAtMs = now;
                recordPersistenceSuccess();
            } catch (Exception error) {
                recordPersistenceFailure("history", error);
            }
        });
    }

    public void persistStreamSources(List<WxmStreamSource> sources) {
        if (sources == null || sources.isEmpty()) {
            return;
        }
        long now = System.currentTimeMillis();
        List<StreamConfigEntity> entities = new ArrayList<>();
        for (WxmStreamSource source : sources) {
            if (source == null || !source.isSecureHttps()) {
                continue;
            }
            entities.add(new StreamConfigEntity(
                    source.getId(),
                    source.getUrl(),
                    source.getPriority(),
                    source.isPrimary(),
                    now
            ));
        }
        if (entities.isEmpty()) {
            return;
        }
        ioExecutor.execute(() -> {
            try {
                database.streamConfigDao().upsertAll(entities);
                streamConfigPersistCount += entities.size();
                recordPersistenceSuccess();
            } catch (Exception error) {
                recordPersistenceFailure("stream_config", error);
            }
        });
    }

    public void persistTelemetrySnapshot(@Nullable WxmPlaybackTelemetry.Snapshot snapshot) {
        if (snapshot == null) {
            return;
        }
        long now = System.currentTimeMillis();
        if (now - lastTelemetryPersistAtMs < TELEMETRY_MIN_INTERVAL_MS) {
            return;
        }
        lastTelemetryPersistAtMs = now;
        ioExecutor.execute(() -> {
            try {
                database.telemetryDao().insert(new TelemetryEntity(
                        now,
                        snapshot.activeStreamId,
                        snapshot.playbackDurationMs,
                        snapshot.totalBufferingMs,
                        snapshot.rebufferCount,
                        snapshot.playbackErrors,
                        snapshot.networkErrors,
                        snapshot.retryCount,
                        snapshot.fallbackSwitchCount,
                        snapshot.metadataUpdateCount,
                        snapshot.audioUnderrunCount,
                        snapshot.lastAudioUnderrunAtMs,
                        snapshot.lastAudioUnderrunElapsedSinceLastFeedMs,
                        snapshot.watchdogRecoveryCount,
                        snapshot.lastWatchdogReason
                ));
                recordPersistenceSuccess();
            } catch (Exception error) {
                recordPersistenceFailure("telemetry", error);
            }
        });
    }

    public WxmDataLayerSnapshot snapshot() {
        return new WxmDataLayerSnapshot(
                roomReady,
                lastAudioProfilePersistAtMs,
                lastPlaybackStatePersistAtMs,
                lastHistoryPersistAtMs,
                lastTelemetryPersistAtMs,
                streamConfigPersistCount,
                persistenceFailureCount,
                lastPersistenceFailureAtMs,
                lastPersistenceFailure
        );
    }

    public void shutdown() {
        ioExecutor.shutdown();
    }

    private String sanitize(String value, String fallback) {
        String safe = value == null ? "" : value.trim();
        return safe.isEmpty() ? fallback : safe;
    }

    private void recordPersistenceSuccess() {
        roomReady = true;
    }

    private void recordPersistenceFailure(String operation, Exception error) {
        roomReady = false;
        persistenceFailureCount++;
        lastPersistenceFailureAtMs = System.currentTimeMillis();
        String type = error == null ? "unknown" : error.getClass().getSimpleName();
        lastPersistenceFailure = sanitize(operation, "unknown") + ":" + sanitize(type, "Exception");
        Log.w(TAG, "Room persistence failure: " + lastPersistenceFailure, error);
    }
}
