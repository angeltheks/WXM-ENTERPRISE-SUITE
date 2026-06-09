package com.wxmoneradio.player.cache;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import java.util.List;

@Dao
public interface FavoriteDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsert(FavoriteEntity entity);

    @Query("SELECT * FROM favorites ORDER BY createdAtMs DESC LIMIT :limit")
    List<FavoriteEntity> recent(int limit);

    @Query("DELETE FROM favorites WHERE id = :id")
    void deleteById(String id);
}
