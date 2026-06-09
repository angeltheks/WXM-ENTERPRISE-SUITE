package com.wxmoneradio.player.cache;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import java.util.List;

@Dao
public interface StreamConfigDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsertAll(List<StreamConfigEntity> entities);

    @Query("SELECT * FROM stream_config ORDER BY priority ASC")
    List<StreamConfigEntity> all();
}
