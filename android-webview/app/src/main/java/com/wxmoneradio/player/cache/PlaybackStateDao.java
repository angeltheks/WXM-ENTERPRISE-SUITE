package com.wxmoneradio.player.cache;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

@Dao
public interface PlaybackStateDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsert(PlaybackStateEntity entity);

    @Query("SELECT * FROM playback_state WHERE id = 'current' LIMIT 1")
    PlaybackStateEntity current();
}
