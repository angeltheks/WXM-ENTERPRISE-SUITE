package com.wxmoneradio.player.cache;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

@Dao
public interface CoverCacheDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsert(CoverCacheEntity entity);

    @Query("SELECT * FROM cover_cache WHERE url = :url LIMIT 1")
    CoverCacheEntity findByUrl(String url);
}
