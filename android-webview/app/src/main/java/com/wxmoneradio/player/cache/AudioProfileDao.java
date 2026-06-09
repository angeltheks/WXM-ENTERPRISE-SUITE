package com.wxmoneradio.player.cache;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

@Dao
public interface AudioProfileDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsert(AudioProfileEntity entity);

    @Query("SELECT * FROM audio_profile WHERE id = 'current' LIMIT 1")
    AudioProfileEntity current();
}
