package com.wxmoneradio.player.cache;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "cover_cache")
public final class CoverCacheEntity {
    @PrimaryKey
    @NonNull
    public String url;
    public String localPath;
    public String etag;
    public long cachedAtMs;
    public long lastAccessedAtMs;

    public CoverCacheEntity(@NonNull String url, String localPath, String etag,
                            long cachedAtMs, long lastAccessedAtMs) {
        this.url = url;
        this.localPath = localPath;
        this.etag = etag;
        this.cachedAtMs = cachedAtMs;
        this.lastAccessedAtMs = lastAccessedAtMs;
    }
}
