package com.wxmoneradio.player.cache;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "history")
public final class HistoryEntity {
    @PrimaryKey(autoGenerate = true)
    public long id;
    public String trackKey;
    public String title;
    public String artist;
    public String coverUrl;
    public long playedAtMs;
    public String dayKey;

    public HistoryEntity(String trackKey, String title, String artist, String coverUrl,
                         long playedAtMs, String dayKey) {
        this.trackKey = trackKey;
        this.title = title;
        this.artist = artist;
        this.coverUrl = coverUrl;
        this.playedAtMs = playedAtMs;
        this.dayKey = dayKey;
    }
}
