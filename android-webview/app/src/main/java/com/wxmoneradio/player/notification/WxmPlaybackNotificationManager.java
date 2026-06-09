package com.wxmoneradio.player.notification;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.media.session.MediaSession;
import android.os.Build;

import androidx.annotation.Nullable;

import com.wxmoneradio.player.MainActivity;
import com.wxmoneradio.player.R;
import com.wxmoneradio.player.RadioPlaybackService;

public final class WxmPlaybackNotificationManager {
    private final Context context;
    private final String channelId;

    public WxmPlaybackNotificationManager(Context context, String channelId) {
        this.context = context;
        this.channelId = channelId;
    }

    public void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationChannel channel = new NotificationChannel(
                channelId,
                "Reproduccion WXM",
                NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Controles de la radio en vivo");
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }

    public Notification build(boolean playing, @Nullable String streamUrl, String title, String artist,
                              @Nullable Bitmap artwork, @Nullable MediaSession.Token sessionToken) {
        Intent openIntent = new Intent(context, MainActivity.class);
        PendingIntent contentIntent = PendingIntent.getActivity(
                context,
                0,
                openIntent,
                pendingIntentFlags()
        );

        PendingIntent playPauseIntent = PendingIntent.getService(
                context,
                1,
                new Intent(context, RadioPlaybackService.class)
                        .setAction(playing ? RadioPlaybackService.ACTION_PAUSE : RadioPlaybackService.ACTION_PLAY)
                        .putExtra(RadioPlaybackService.EXTRA_STREAM_URL, streamUrl),
                pendingIntentFlags()
        );

        PendingIntent reconnectIntent = PendingIntent.getService(
                context,
                2,
                new Intent(context, RadioPlaybackService.class)
                        .setAction(RadioPlaybackService.ACTION_RECONNECT)
                        .putExtra(RadioPlaybackService.EXTRA_STREAM_URL, streamUrl),
                pendingIntentFlags()
        );

        PendingIntent stopIntent = PendingIntent.getService(
                context,
                3,
                new Intent(context, RadioPlaybackService.class)
                        .setAction(RadioPlaybackService.ACTION_STOP),
                pendingIntentFlags()
        );

        Notification.Action reconnectAction = new Notification.Action.Builder(
                R.drawable.ic_notification_reconnect,
                "Reconectar",
                reconnectIntent
        ).build();
        Notification.Action playPauseAction = new Notification.Action.Builder(
                playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                playing ? "Pausar" : "Reproducir",
                playPauseIntent
        ).build();
        Notification.Action stopAction = new Notification.Action.Builder(
                R.drawable.ic_notification_stop,
                "Detener",
                stopIntent
        ).build();

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(context, channelId)
                : new Notification.Builder(context);
        builder.setSmallIcon(R.drawable.ic_stat_radio)
                .setLargeIcon(artwork)
                .setContentTitle(title)
                .setContentText(artist + " · WXM ONE RADIO")
                .setSubText(playing ? "En vivo" : "Pausado")
                .setContentIntent(contentIntent)
                .setCategory(Notification.CATEGORY_TRANSPORT)
                .setOngoing(playing)
                .setDeleteIntent(stopIntent)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .addAction(reconnectAction)
                .addAction(playPauseAction)
                .addAction(stopAction);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && sessionToken != null) {
            builder.setColor(0xFFE91E63);
            builder.setStyle(new Notification.MediaStyle()
                    .setMediaSession(sessionToken)
                    .setShowActionsInCompactView(1, 2));
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder.setColorized(true);
        }
        return builder.build();
    }

    private int pendingIntentFlags() {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return flags;
    }
}
