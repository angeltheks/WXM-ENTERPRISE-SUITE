package com.wxmoneradio.player.cache;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "audio_profile")
public final class AudioProfileEntity {
    @PrimaryKey
    @NonNull
    public String id;
    @NonNull
    public String profileId;
    public float volume;
    public boolean muted;
    public long updatedAtMs;

    public AudioProfileEntity(@NonNull String id, @NonNull String profileId, float volume,
                              boolean muted, long updatedAtMs) {
        this.id = id;
        this.profileId = profileId;
        this.volume = volume;
        this.muted = muted;
        this.updatedAtMs = updatedAtMs;
    }
}
