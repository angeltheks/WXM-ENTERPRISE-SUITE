package com.wxmoneradio.player.cache;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import java.util.List;

@Dao
public interface TelemetryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(TelemetryEntity entity);

    @Query("SELECT * FROM telemetry ORDER BY capturedAtMs DESC LIMIT :limit")
    List<TelemetryEntity> recent(int limit);
}
