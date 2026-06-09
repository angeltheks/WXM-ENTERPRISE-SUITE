package com.wxmoneradio.player.cache;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import java.util.List;

@Dao
public interface HistoryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(HistoryEntity entity);

    @Query("SELECT * FROM history ORDER BY playedAtMs DESC LIMIT :limit")
    List<HistoryEntity> recent(int limit);

    @Query("SELECT * FROM history WHERE dayKey = :dayKey ORDER BY playedAtMs DESC LIMIT :limit")
    List<HistoryEntity> byDay(String dayKey, int limit);
}
