package com.wxmoneradio.player.cache;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "playback_state")
public final class PlaybackStateEntity {
    @PrimaryKey
    @NonNull
    public String id;
    @NonNull
    public String state;
    public String streamId;
    public boolean playing;
    public long updatedAtMs;

    public PlaybackStateEntity(@NonNull String id, @NonNull String state, String streamId,
                               boolean playing, long updatedAtMs) {
        this.id = id;
        this.state = state;
        this.streamId = streamId;
        this.playing = playing;
        this.updatedAtMs = updatedAtMs;
    }
}
