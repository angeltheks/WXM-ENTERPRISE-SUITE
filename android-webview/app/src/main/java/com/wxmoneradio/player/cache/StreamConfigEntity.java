package com.wxmoneradio.player.cache;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "stream_config")
public final class StreamConfigEntity {
    @PrimaryKey
    @NonNull
    public String id;
    @NonNull
    public String url;
    public int priority;
    public boolean primaryStream;
    public long updatedAtMs;

    public StreamConfigEntity(@NonNull String id, @NonNull String url, int priority,
                              boolean primaryStream, long updatedAtMs) {
        this.id = id;
        this.url = url;
        this.priority = priority;
        this.primaryStream = primaryStream;
        this.updatedAtMs = updatedAtMs;
    }
}
