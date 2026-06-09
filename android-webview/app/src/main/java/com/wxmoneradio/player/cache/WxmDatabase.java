package com.wxmoneradio.player.cache;

import androidx.room.Database;
import androidx.room.migration.Migration;
import androidx.room.RoomDatabase;
import androidx.sqlite.db.SupportSQLiteDatabase;

@Database(
        entities = {
                FavoriteEntity.class,
                HistoryEntity.class,
                TelemetryEntity.class,
                StreamConfigEntity.class,
                AudioProfileEntity.class,
                CoverCacheEntity.class,
                PlaybackStateEntity.class
        },
        version = 2,
        exportSchema = false
)
public abstract class WxmDatabase extends RoomDatabase {
    public static final Migration MIGRATION_1_2 = new Migration(1, 2) {
        @Override
        public void migrate(SupportSQLiteDatabase database) {
            database.execSQL("ALTER TABLE telemetry ADD COLUMN audioUnderrunCount INTEGER NOT NULL DEFAULT 0");
            database.execSQL("ALTER TABLE telemetry ADD COLUMN lastAudioUnderrunAtMs INTEGER NOT NULL DEFAULT 0");
            database.execSQL("ALTER TABLE telemetry ADD COLUMN lastAudioUnderrunElapsedSinceLastFeedMs INTEGER NOT NULL DEFAULT 0");
            database.execSQL("ALTER TABLE telemetry ADD COLUMN watchdogRecoveryCount INTEGER NOT NULL DEFAULT 0");
            database.execSQL("ALTER TABLE telemetry ADD COLUMN lastWatchdogReason TEXT");
        }
    };

    public abstract FavoriteDao favoriteDao();
    public abstract HistoryDao historyDao();
    public abstract TelemetryDao telemetryDao();
    public abstract StreamConfigDao streamConfigDao();
    public abstract AudioProfileDao audioProfileDao();
    public abstract CoverCacheDao coverCacheDao();
    public abstract PlaybackStateDao playbackStateDao();
}
