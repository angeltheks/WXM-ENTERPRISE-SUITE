package com.wxmoneradio.player.cache;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "favorites")
public final class FavoriteEntity {
    @PrimaryKey
    @NonNull
    public String id;
    @NonNull
    public String type;
    @NonNull
    public String itemId;
    @NonNull
    public String title;
    public String subtitle;
    public String imageUrl;
    public long createdAtMs;

    public FavoriteEntity(@NonNull String id, @NonNull String type, @NonNull String itemId,
                          @NonNull String title, String subtitle, String imageUrl, long createdAtMs) {
        this.id = id;
        this.type = type;
        this.itemId = itemId;
        this.title = title;
        this.subtitle = subtitle;
        this.imageUrl = imageUrl;
        this.createdAtMs = createdAtMs;
    }
}
