package com.wxmoneradio.player;

import android.app.Notification;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.media.audiofx.BassBoost;
import android.media.audiofx.Equalizer;
import android.media.audiofx.LoudnessEnhancer;
import android.media.audiofx.Virtualizer;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.audio.AudioProcessor;
import androidx.media3.exoplayer.DefaultRenderersFactory;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.audio.AudioSink;
import androidx.media3.exoplayer.audio.DefaultAudioSink;

import com.wxmoneradio.player.audiofocus.WxmAudioFocusManager;
import com.wxmoneradio.player.artwork.WxmArtworkLoader;
import com.wxmoneradio.player.bridge.WxmBridgeStatusStore;
import com.wxmoneradio.player.buffer.WxmBufferEngine;
import com.wxmoneradio.player.buffer.WxmBufferProfile;
import com.wxmoneradio.player.buffer.WxmBufferSnapshot;
import com.wxmoneradio.player.cache.WxmDataLayerSnapshot;
import com.wxmoneradio.player.cache.WxmDataRepository;
import com.wxmoneradio.player.commands.WxmPlaybackCommand;
import com.wxmoneradio.player.config.WxmRemoteConfigManager;
import com.wxmoneradio.player.engine.WxmFallbackManager;
import com.wxmoneradio.player.engine.WxmRetryPolicy;
import com.wxmoneradio.player.engine.WxmStreamEngine;
import com.wxmoneradio.player.engine.WxmStreamHealth;
import com.wxmoneradio.player.engine.WxmStreamSnapshot;
import com.wxmoneradio.player.engine.WxmStreamSource;
import com.wxmoneradio.player.network.WxmNetworkEngine;
import com.wxmoneradio.player.network.WxmNetworkConfig;
import com.wxmoneradio.player.network.WxmNetworkMonitor;
import com.wxmoneradio.player.network.WxmNetworkScore;
import com.wxmoneradio.player.network.WxmNetworkSnapshot;
import com.wxmoneradio.player.notification.WxmPlaybackNotificationManager;
import com.wxmoneradio.player.recovery.WxmPlaybackRecoveryController;
import com.wxmoneradio.player.routes.WxmAudioRouteManager;
import com.wxmoneradio.player.session.WxmLegacyMediaSessionController;
import com.wxmoneradio.player.session.WxmPlaybackSessionController;
import com.wxmoneradio.player.spatial.WxmSpatialCapabilities;
import com.wxmoneradio.player.telemetry.WxmPlaybackTelemetry;

import org.json.JSONException;
import org.json.JSONObject;

public class RadioPlaybackService extends Service {
    public static final String ACTION_PLAY = "com.wxmoneradio.player.PLAY";
    public static final String ACTION_PAUSE = "com.wxmoneradio.player.PAUSE";
    public static final String ACTION_STOP = "com.wxmoneradio.player.STOP";
    public static final String ACTION_RECONNECT = "com.wxmoneradio.player.RECONNECT";
    public static final String ACTION_METADATA = "com.wxmoneradio.player.METADATA";
    public static final String ACTION_AUDIO_PROFILE = "com.wxmoneradio.player.AUDIO_PROFILE";
    public static final String ACTION_VOLUME = "com.wxmoneradio.player.VOLUME";
    public static final String EXTRA_STREAM_URL = "streamUrl";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_ARTIST = "artist";
    public static final String EXTRA_COVER = "cover";
    public static final String EXTRA_AUDIO_PROFILE = "audioProfile";
    public static final String EXTRA_VOLUME = "volume";
    public static final String EXTRA_MUTED = "muted";

    private static final String CHANNEL_ID = "wxm_radio_playback";
    private static final int NOTIFICATION_ID = 1001;
    private static final long PRIMARY_RECOVERY_DELAY_MS = 60000L;
    private static final long PLAYBACK_WATCHDOG_INTERVAL_MS = 5000L;
    private static final long READY_STALL_THRESHOLD_MS = 15000L;
    private static final long BUFFERING_STALL_THRESHOLD_MS = 45000L;

    private ExoPlayer player;
    private WxmPlaybackSessionController sessionController;
    private String streamUrl;
    private String currentTitle = "WXM ONE RADIO";
    private String currentArtist = "Radio en vivo";
    private String currentCover = "";
    private boolean isPlaying;
    private float currentVolume = 0.7f;
    private boolean isMuted;
    private Bitmap stationArt;
    private Bitmap currentArt;
    private WxmArtworkLoader artworkLoader;
    private WxmPlaybackNotificationManager notificationController;
    private WxmPlaybackRecoveryController recoveryController;
    private String audioProfile = "standard";
    private Equalizer equalizer;
    private BassBoost bassBoost;
    private Virtualizer virtualizer;
    private LoudnessEnhancer loudnessEnhancer;
    private WxmAudioProcessor wxmAudioProcessor;
    private Handler mainHandler;
    private WxmRemoteConfigManager remoteConfigManager;
    private WxmFallbackManager fallbackManager;
    private WxmRetryPolicy retryPolicy;
    private WxmStreamEngine streamEngine;
    private WxmBufferEngine bufferEngine;
    private WxmNetworkConfig networkConfig;
    private WxmNetworkEngine networkEngine;
    private WxmNetworkMonitor networkMonitor;
    private WxmPlaybackTelemetry playbackTelemetry;
    private WxmAudioFocusManager audioFocusManager;
    private WxmAudioRouteManager audioRouteManager;
    private WxmSpatialCapabilities spatialCapabilities;
    private WxmDataRepository dataRepository;
    private int retryAttemptForCurrentSource;
    private boolean userStopped = true;
    private boolean pausedForFocusLoss;
    private String playbackEngineState = "idle";
    private BroadcastReceiver noisyReceiver;
    private boolean noisyReceiverRegistered;

    @Override
    public void onCreate() {
        super.onCreate();
        mainHandler = new Handler(Looper.getMainLooper());
        remoteConfigManager = new WxmRemoteConfigManager();
        fallbackManager = new WxmFallbackManager(remoteConfigManager.loadStreamSources());
        retryPolicy = WxmRetryPolicy.radioDefault();
        bufferEngine = new WxmBufferEngine();
        networkConfig = WxmNetworkConfig.radioDefault();
        networkMonitor = new WxmNetworkMonitor(this);
        playbackTelemetry = new WxmPlaybackTelemetry();
        dataRepository = WxmDataRepository.get(this);
        networkEngine = new WxmNetworkEngine(networkConfig, playbackTelemetry);
        streamEngine = new WxmStreamEngine(fallbackManager, retryPolicy, networkMonitor, playbackTelemetry);
        dataRepository.persistStreamSources(remoteConfigManager.loadStreamSources());
        audioRouteManager = new WxmAudioRouteManager(this);
        spatialCapabilities = new WxmSpatialCapabilities(this);
        artworkLoader = new WxmArtworkLoader();
        notificationController = new WxmPlaybackNotificationManager(this, CHANNEL_ID);
        networkMonitor.start();
        audioRouteManager.start(mainHandler, snapshot -> publishBridgeStatus(playbackEngineState));
        registerNoisyReceiver();
        audioFocusManager = new WxmAudioFocusManager(this, new WxmAudioFocusManager.Callback() {
            @Override
            public void onAudioFocusGained() {
                applyCurrentVolume();
                publishBridgeStatus(isPlaying ? "playing" : "paused");
                if (pausedForFocusLoss) {
                    pausedForFocusLoss = false;
                    userStopped = false;
                    playStream();
                }
            }

            @Override
            public void onAudioFocusLostTransient() {
                pauseForAudioFocus(true);
            }

            @Override
            public void onAudioFocusLostPermanent() {
                pausedForFocusLoss = false;
                pausePlayback();
            }

            @Override
            public void onAudioFocusDuck() {
                if (player != null) {
                    player.setVolume(isMuted ? 0f : Math.max(0.08f, currentVolume * 0.25f));
                }
            }
        });
        recoveryController = new WxmPlaybackRecoveryController(
                mainHandler,
                new WxmPlaybackRecoveryController.Delegate() {
                    @Override
                    public Player getPlayer() {
                        return player;
                    }

                    @Override
                    public boolean isUserStopped() {
                        return userStopped;
                    }

                    @Override
                    public boolean tryRecoverPrimary() {
                        return streamEngine != null && streamEngine.tryRecoverPrimary();
                    }

                    @Override
                    public void onPrimaryRecovered() {
                        retryAttemptForCurrentSource = 0;
                        publishBridgeStatus("recovering_primary");
                        restartPlaybackFromCurrentSource();
                    }

                    @Override
                    public void onPrimaryRecoveryDeferred() {
                        publishBridgeStatus("waiting_recovery");
                    }

                    @Override
                    public void onWatchdogRecovery(String reason) {
                        if (playbackTelemetry != null) {
                            playbackTelemetry.recordWatchdogRecovery(reason);
                        }
                        if (streamEngine != null) {
                            streamEngine.markRecovering();
                            streamEngine.recordRetry(reason);
                        }
                        publishBridgeStatus("recovering");
                        restartPlaybackFromCurrentSource();
                    }
                },
                PRIMARY_RECOVERY_DELAY_MS,
                PLAYBACK_WATCHDOG_INTERVAL_MS,
                READY_STALL_THRESHOLD_MS,
                BUFFERING_STALL_THRESHOLD_MS
        );
        notificationController.createChannel();
        stationArt = BitmapFactory.decodeResource(getResources(), R.drawable.wxm_lock_art);
        currentArt = stationArt;
        sessionController = new WxmLegacyMediaSessionController(this, ACTION_RECONNECT, ACTION_STOP,
                new WxmLegacyMediaSessionController.Callback() {
            @Override
            public void onPlay() {
                playStream();
            }

            @Override
            public void onPause() {
                pausePlayback();
                startForeground(NOTIFICATION_ID, buildNotification(false));
            }

            @Override
            public void onStop() {
                stopPlayback();
                stopForeground(true);
                stopSelf();
            }

            @Override
            public void onReconnect() {
                handleReconnectRequested();
            }
        });
        publishBridgeStatus("idle");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        WxmPlaybackCommand command = WxmPlaybackCommand.from(intent, currentVolume, isMuted);
        if (command.type == WxmPlaybackCommand.Type.STOP) {
            userStopped = true;
            stopPlayback();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }
        if (command.type == WxmPlaybackCommand.Type.RECONNECT) {
            handleReconnectRequested();
            return START_STICKY;
        }
        if (command.type == WxmPlaybackCommand.Type.METADATA) {
            updateMetadataFromCommand(command);
            updateMediaSession();
            if (isPlaying) {
                startForeground(NOTIFICATION_ID, buildNotification(true));
            }
            publishBridgeStatus(isPlaying ? "playing" : "paused");
            return START_STICKY;
        }
        if (command.type == WxmPlaybackCommand.Type.AUDIO_PROFILE) {
            updateAudioProfileFromCommand(command);
            applyAudioProfile();
            persistAudioProfile();
            publishBridgeStatus(playbackEngineState);
            return START_STICKY;
        }
        if (command.type == WxmPlaybackCommand.Type.VOLUME) {
            updateVolumeFromCommand(command);
            applyCurrentVolume();
            persistAudioProfile();
            publishBridgeStatus(playbackEngineState);
            return START_STICKY;
        }
        if (command.type == WxmPlaybackCommand.Type.PAUSE) {
            pausePlayback();
            updateMediaSession();
            startForeground(NOTIFICATION_ID, buildNotification(false));
            return START_STICKY;
        }

        String requestedUrl = command.streamUrl;
        if (requestedUrl != null && streamEngine != null) {
            WxmStreamSource configuredSource = streamEngine.configureRuntimePrimary(requestedUrl);
            streamUrl = configuredSource != null ? configuredSource.getUrl() : streamUrl;
        } else if (requestedUrl != null && requestedUrl.startsWith("https://")) {
            streamUrl = requestedUrl;
        }
        if (requestedUrl != null && streamEngine != null) {
            WxmStreamSource configuredSource = streamEngine.getCurrentSource();
            if (configuredSource != null && configuredSource.isSecureHttps()) {
                streamUrl = configuredSource.getUrl();
            }
        }
        updateAudioProfileFromCommand(command);
        updateVolumeFromCommand(command);
        persistAudioProfile();

        startForeground(NOTIFICATION_ID, buildNotification(false));
        userStopped = false;
        publishBridgeStatus("loading");
        playStream();
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void playStream() {
        WxmStreamSource source = streamEngine != null ? streamEngine.getCurrentSource() : null;
        if ((streamUrl == null || streamUrl.isEmpty()) && source != null) {
            streamUrl = source.getUrl();
        }
        if (streamUrl == null || streamUrl.isEmpty() || !streamUrl.startsWith("https://")) return;

        try {
            if (playbackTelemetry != null) {
                playbackTelemetry.recordPlaybackRequested();
            }
            if (audioFocusManager != null && !audioFocusManager.requestPlaybackFocus()) {
                isPlaying = false;
                updateMediaSession();
                startForeground(NOTIFICATION_ID, buildNotification(false));
                publishBridgeStatus("audio_focus_denied");
                return;
            }
            if (player != null) {
                applyCurrentVolume();
                player.play();
                schedulePlaybackWatchdog();
                updateMediaSession();
                startForeground(NOTIFICATION_ID, buildNotification(player.isPlaying()));
                publishBridgeStatus(player.isPlaying() ? "playing" : playbackEngineState);
                return;
            }

            publishBridgeStatus("loading");
            if (streamEngine != null) {
                streamEngine.markStarting();
            }
            wxmAudioProcessor = new WxmAudioProcessor();
            wxmAudioProcessor.setProfile(audioProfile);
            WxmNetworkScore score = streamEngine != null
                    ? streamEngine.getNetworkScore()
                    : WxmNetworkScore.ACCEPTABLE;
            WxmNetworkSnapshot networkSnapshot = networkMonitor != null
                    ? networkMonitor.getSnapshot()
                    : null;
            WxmPlaybackTelemetry.Snapshot telemetrySnapshot = playbackTelemetry != null
                    ? playbackTelemetry.snapshot()
                    : null;
            player = new ExoPlayer.Builder(this, buildRenderersFactory())
                    .setMediaSourceFactory(networkEngine.createMediaSourceFactory())
                    .setLoadControl(bufferEngine.createLoadControl(networkSnapshot, telemetrySnapshot))
                    .build();
            if (playbackTelemetry != null) {
                player.addAnalyticsListener(playbackTelemetry);
                WxmStreamSource currentSource = streamEngine != null ? streamEngine.getCurrentSource() : null;
                playbackTelemetry.setActiveStreamId(currentSource != null ? currentSource.getId() : "runtime_primary");
            }
            player.setAudioAttributes(
                    new AudioAttributes.Builder()
                            .setUsage(C.USAGE_MEDIA)
                            .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                            .build(),
                    true
            );
            player.setWakeMode(C.WAKE_MODE_LOCAL);
            applyCurrentVolume();
            player.addListener(new Player.Listener() {
                @Override
                public void onPlaybackStateChanged(int playbackState) {
                    if (playbackState == Player.STATE_READY) {
                        retryAttemptForCurrentSource = 0;
                        cancelPrimaryRecovery();
                        notePlayerProgress();
                        if (streamEngine != null) {
                            streamEngine.markReady();
                        }
                        applyAudioProfile();
                        updateMediaSession();
                        startForeground(NOTIFICATION_ID, buildNotification(player.isPlaying()));
                        publishBridgeStatus(player.isPlaying() ? "playing" : "ready");
                    } else if (playbackState == Player.STATE_BUFFERING) {
                        if (streamEngine != null) {
                            streamEngine.markBuffering();
                        }
                        updateMediaSession();
                        startForeground(NOTIFICATION_ID, buildNotification(false));
                        publishBridgeStatus("buffering");
                    } else if (playbackState == Player.STATE_ENDED) {
                        isPlaying = false;
                        updateMediaSession();
                        startForeground(NOTIFICATION_ID, buildNotification(false));
                        publishBridgeStatus("ended");
                    }
                }

                @Override
                public void onIsPlayingChanged(boolean isPlayingNow) {
                    isPlaying = isPlayingNow;
                    if (playbackTelemetry != null && isPlayingNow) {
                        playbackTelemetry.recordPlaybackResumed();
                    }
                    if (isPlayingNow) {
                        notePlayerProgress();
                    }
                    if (streamEngine != null) {
                        if (isPlayingNow) {
                            streamEngine.markPlaying();
                        } else if (player != null && player.getPlaybackState() == Player.STATE_BUFFERING) {
                            streamEngine.markBuffering();
                        } else {
                            streamEngine.markPaused();
                        }
                    }
                    updateMediaSession();
                    startForeground(NOTIFICATION_ID, buildNotification(isPlayingNow));
                    if (isPlayingNow) {
                        publishBridgeStatus("playing");
                    } else if (player != null && player.getPlaybackState() == Player.STATE_BUFFERING) {
                        publishBridgeStatus("buffering");
                    } else {
                        publishBridgeStatus("paused");
                    }
                }

                @Override
                public void onPlayerError(PlaybackException error) {
                    handlePlaybackError(error);
                }
            });
            WxmStreamSource currentSource = streamEngine != null ? streamEngine.getCurrentSource() : null;
            if (currentSource != null && currentSource.isSecureHttps()) {
                streamUrl = currentSource.getUrl();
            }
            player.setMediaItem(MediaItem.fromUri(streamUrl));
            player.prepare();
            player.play();
            schedulePlaybackWatchdog();
        } catch (Exception ignored) {
            isPlaying = false;
            startForeground(NOTIFICATION_ID, buildNotification(false));
            releasePlayer();
            publishBridgeStatus("error");
            schedulePrimaryRecovery();
        }
    }

    private void pausePlayback() {
        userStopped = true;
        if (mainHandler != null) {
            mainHandler.removeCallbacksAndMessages(null);
        }
        cancelPrimaryRecovery();
        if (recoveryController != null) {
            recoveryController.cancelPlaybackWatchdog();
        }
        if (player != null) {
            player.pause();
        }
        isPlaying = false;
        if (playbackTelemetry != null) {
            playbackTelemetry.recordPlaybackPaused("user");
        }
        if (streamEngine != null) {
            streamEngine.markPaused();
        }
        updateMediaSession();
        if (audioFocusManager != null) {
            audioFocusManager.abandonFocus();
        }
        publishBridgeStatus("paused");
    }

    private void stopPlayback() {
        userStopped = true;
        if (mainHandler != null) {
            mainHandler.removeCallbacksAndMessages(null);
        }
        cancelPrimaryRecovery();
        if (recoveryController != null) {
            recoveryController.cancelPlaybackWatchdog();
        }
        isPlaying = false;
        if (playbackTelemetry != null) {
            playbackTelemetry.recordPlaybackStopped();
        }
        if (streamEngine != null) {
            streamEngine.markStopped();
        }
        updateMediaSession();
        releasePlayer();
        if (audioFocusManager != null) {
            audioFocusManager.abandonFocus();
        }
        publishBridgeStatus("idle");
    }

    private void pauseForAudioFocus(boolean resumeWhenFocusReturns) {
        pausedForFocusLoss = resumeWhenFocusReturns && player != null && player.isPlaying();
        if (player != null) {
            player.pause();
        }
        isPlaying = false;
        if (playbackTelemetry != null) {
            playbackTelemetry.recordPlaybackPaused("audio_focus");
        }
        updateMediaSession();
        startForeground(NOTIFICATION_ID, buildNotification(false));
        publishBridgeStatus("audio_focus_paused");
    }

    private void handlePlaybackError(PlaybackException error) {
        isPlaying = false;
        if (playbackTelemetry != null) {
            playbackTelemetry.recordPlaybackPaused("error");
        }
        if (streamEngine != null) {
            streamEngine.markFailed();
        }
        updateMediaSession();
        startForeground(NOTIFICATION_ID, buildNotification(false));
        releasePlayer();
        publishBridgeStatus("error");

        if (userStopped) {
            return;
        }

        WxmRetryPolicy.Decision decision = streamEngine != null
                ? streamEngine.evaluateRetry(error, retryAttemptForCurrentSource)
                : retryPolicy.evaluate(error, retryAttemptForCurrentSource, WxmNetworkScore.ACCEPTABLE);
        if (decision.shouldRetry()) {
            if (decision.countsTowardsAttempt()) {
                retryAttemptForCurrentSource++;
            }
            if (streamEngine != null) {
                streamEngine.recordRetry(decision.getReason());
                streamEngine.markRecovering();
            }
            publishBridgeStatus("recovering");
            scheduleRestart(decision.getDelayMs());
            return;
        }

        if (streamEngine != null && streamEngine.moveToNextFallback()) {
            retryAttemptForCurrentSource = 0;
            WxmStreamSource nextSource = streamEngine.getCurrentSource();
            if (nextSource != null) {
                streamUrl = nextSource.getUrl();
                publishBridgeStatus("fallback");
                scheduleRestart(750L);
                return;
            }
        }

        if (fallbackManager != null) {
            if (fallbackManager.allSourcesUnavailableNow()) {
                publishBridgeStatus("waiting_recovery");
            } else if (fallbackManager.allSourcesExhausted()) {
                publishBridgeStatus("unavailable");
            }
        }
        schedulePrimaryRecovery();
    }

    private void scheduleRestart(long delayMs) {
        if (mainHandler == null) {
            return;
        }
        mainHandler.postDelayed(() -> {
            if (!userStopped) {
                restartPlaybackFromCurrentSource();
            }
        }, Math.max(0L, delayMs));
    }

    private void restartPlaybackFromCurrentSource() {
        WxmStreamSource source = streamEngine != null ? streamEngine.getCurrentSource() : null;
        if (source != null && source.isSecureHttps()) {
            streamUrl = source.getUrl();
        }
        releasePlayer();
        playStream();
    }

    private void handleReconnectRequested() {
        userStopped = false;
        pausedForFocusLoss = false;
        retryAttemptForCurrentSource = 0;
        cancelPrimaryRecovery();
        if (streamEngine != null) {
            streamEngine.beginNewFallbackRound();
            streamEngine.markRecovering();
        }
        publishBridgeStatus("recovering");
        restartPlaybackFromCurrentSource();
    }

    private void schedulePlaybackWatchdog() {
        if (recoveryController != null) {
            recoveryController.schedulePlaybackWatchdog();
        }
    }

    private void resetPlaybackWatchdog() {
        if (recoveryController != null) {
            recoveryController.resetPlaybackWatchdog();
        }
    }

    private void notePlayerProgress() {
        if (recoveryController != null) {
            recoveryController.notePlayerProgress();
        }
    }

    private void schedulePrimaryRecovery() {
        if (recoveryController != null) {
            recoveryController.schedulePrimaryRecovery();
        }
    }

    private void cancelPrimaryRecovery() {
        if (recoveryController != null) {
            recoveryController.cancelPrimaryRecovery();
        }
    }

    private void publishBridgeStatus(String state) {
        playbackEngineState = state == null ? playbackEngineState : state;
        JSONObject json = WxmBridgeStatusStore.base(playbackEngineState);
        try {
            WxmNetworkScore score = streamEngine != null
                    ? streamEngine.getNetworkScore()
                    : WxmNetworkScore.ACCEPTABLE;
            WxmNetworkSnapshot networkSnapshot = networkMonitor != null
                    ? networkMonitor.getSnapshot()
                    : null;
            WxmStreamSource source = streamEngine != null ? streamEngine.getCurrentSource() : null;
            WxmStreamSnapshot streamSnapshot = streamEngine != null
                    ? streamEngine.snapshot()
                    : null;
            WxmPlaybackTelemetry.Snapshot telemetry = playbackTelemetry != null
                    ? playbackTelemetry.snapshot()
                    : null;
            WxmBufferSnapshot bufferSnapshot = bufferEngine != null
                    ? bufferEngine.evaluate(networkSnapshot, telemetry)
                    : null;
            WxmBufferProfile bufferProfile = bufferSnapshot != null
                    ? bufferSnapshot.activeProfile
                    : WxmBufferProfile.STANDARD;
            WxmAudioRouteManager.RouteSnapshot route = audioRouteManager != null
                    ? audioRouteManager.snapshot()
                    : null;
            WxmSpatialCapabilities.SpatialSnapshot spatial = spatialCapabilities != null
                    ? spatialCapabilities.snapshot()
                    : null;
            WxmDataLayerSnapshot dataLayer = dataRepository != null
                    ? dataRepository.snapshot()
                    : null;

            json.put("playing", isPlaying);
            json.put("audioProfile", audioProfile);
            json.put("volume", currentVolume);
            json.put("muted", isMuted);
            json.put("streamUrlSecure", streamUrl != null && streamUrl.startsWith("https://"));
            json.put("retryAttempt", retryAttemptForCurrentSource);
            json.put("bufferProfile", bufferProfile.name());
            json.put("networkScore", score.name());
            json.put("networkScoreValue", score.getValue());
            json.put("dspActive", wxmAudioProcessor != null);
            if (networkSnapshot != null) {
                JSONObject networkJson = new JSONObject();
                networkJson.put("score", networkSnapshot.score.name());
                networkJson.put("previousScore", networkSnapshot.previousScore.name());
                networkJson.put("connected", networkSnapshot.connected);
                networkJson.put("validated", networkSnapshot.validated);
                networkJson.put("metered", networkSnapshot.metered);
                networkJson.put("transport", networkSnapshot.transport);
                networkJson.put("downstreamKbps", networkSnapshot.downstreamKbps);
                networkJson.put("updatedAtMs", networkSnapshot.updatedAtMs);
                networkJson.put("changeCount", networkSnapshot.changeCount);
                networkJson.put("lastChangedAtMs", networkSnapshot.lastChangedAtMs);
                networkJson.put("lastConnectedAtMs", networkSnapshot.lastConnectedAtMs);
                networkJson.put("lastDisconnectedAtMs", networkSnapshot.lastDisconnectedAtMs);
                json.put("network", networkJson);
            }
            if (bufferSnapshot != null) {
                JSONObject bufferJson = new JSONObject();
                bufferJson.put("activeProfile", bufferSnapshot.activeProfile.name());
                bufferJson.put("recommendedProfile", bufferSnapshot.recommendedProfile.name());
                bufferJson.put("health", bufferSnapshot.health.name());
                bufferJson.put("reason", bufferSnapshot.reason.name());
                bufferJson.put("pendingProfileChange", bufferSnapshot.pendingProfileChange);
                bufferJson.put("recentRebufferCount", bufferSnapshot.recentRebufferCount);
                bufferJson.put("recentBufferingMs", bufferSnapshot.recentBufferingMs);
                bufferJson.put("appliedProfileChangeCount", bufferSnapshot.appliedProfileChangeCount);
                bufferJson.put("activeProfileAppliedAtMs", bufferSnapshot.activeProfileAppliedAtMs);
                bufferJson.put("evaluatedAtMs", bufferSnapshot.evaluatedAtMs);
                bufferJson.put("deescalationHoldRemainingMs", bufferSnapshot.deescalationHoldRemainingMs);
                bufferJson.put("forced", bufferSnapshot.forced);
                json.put("buffer", bufferJson);
            }

            if (source != null) {
                json.put("streamId", source.getId());
                json.put("streamPriority", source.getPriority());
                json.put("streamSecure", source.isSecureHttps());
            }
            if (streamSnapshot != null) {
                JSONObject streamLifecycleJson = new JSONObject();
                streamLifecycleJson.put("state", streamSnapshot.lifecycleState.name());
                streamLifecycleJson.put("activeStreamId", streamSnapshot.activeStreamId);
                streamLifecycleJson.put("activeStreamSecure", streamSnapshot.activeStreamSecure);
                streamLifecycleJson.put("lastTransitionAtMs", streamSnapshot.lastTransitionAtMs);
                streamLifecycleJson.put("lastTransitionReason", streamSnapshot.lastTransitionReason);
                streamLifecycleJson.put("rejectedRuntimePrimaryCount", streamSnapshot.rejectedRuntimePrimaryCount);
                json.put("streamLifecycle", streamLifecycleJson);
            }
            if (fallbackManager != null) {
                json.put("streamHealth", fallbackManager.getCurrentHealth().name());
                json.put("fallbackIndex", fallbackManager.getCurrentIndex());
                json.put("fallbackCount", fallbackManager.getSourceCount());
                json.put("configuredFallbackCount", fallbackManager.getFallbackCount());
                json.put("fallbackAvailable", fallbackManager.hasFallbackAvailable());
                json.put("fallbackConfigured", fallbackManager.hasConfiguredFallbacks());
                json.put("allStreamsExhausted", fallbackManager.allSourcesExhausted());
                json.put("allStreamsUnavailableNow", fallbackManager.allSourcesUnavailableNow());
                JSONObject streamHealthJson = new JSONObject();
                for (java.util.Map.Entry<String, WxmStreamHealth> entry : fallbackManager.getSourceHealthSnapshot().entrySet()) {
                    streamHealthJson.put(entry.getKey(), entry.getValue().name());
                }
                json.put("streamHealthBySource", streamHealthJson);
                org.json.JSONArray streamSourcesJson = new org.json.JSONArray();
                for (WxmFallbackManager.SourceSnapshot snapshot : fallbackManager.getSourceSnapshots()) {
                    JSONObject sourceJson = new JSONObject();
                    sourceJson.put("id", snapshot.id);
                    sourceJson.put("priority", snapshot.priority);
                    sourceJson.put("primary", snapshot.primary);
                    sourceJson.put("active", snapshot.active);
                    sourceJson.put("health", snapshot.health.name());
                    sourceJson.put("totalFailures", snapshot.totalFailures);
                    sourceJson.put("consecutiveFailures", snapshot.consecutiveFailures);
                    sourceJson.put("lastFailureAtMs", snapshot.lastFailureAtMs);
                    sourceJson.put("lastHealthyAtMs", snapshot.lastHealthyAtMs);
                    sourceJson.put("eligible", snapshot.eligible);
                    sourceJson.put("cooldownRemainingMs", snapshot.cooldownRemainingMs);
                    sourceJson.put("quarantineRemainingMs", snapshot.quarantineRemainingMs);
                    streamSourcesJson.put(sourceJson);
                }
                json.put("streamSources", streamSourcesJson);
            }
            if (telemetry != null) {
                JSONObject telemetryJson = new JSONObject();
                telemetryJson.put("activeStreamId", telemetry.activeStreamId);
                telemetryJson.put("playbackRequestedAtMs", telemetry.playbackRequestedAtMs);
                telemetryJson.put("playbackStartedAtMs", telemetry.playbackStartedAtMs);
                telemetryJson.put("lastReadyAtMs", telemetry.lastReadyAtMs);
                telemetryJson.put("playbackDurationMs", telemetry.playbackDurationMs);
                telemetryJson.put("activelyPlaying", telemetry.activelyPlaying);
                telemetryJson.put("playbackRequestCount", telemetry.playbackRequestCount);
                telemetryJson.put("playbackResumeCount", telemetry.playbackResumeCount);
                telemetryJson.put("playbackPauseCount", telemetry.playbackPauseCount);
                telemetryJson.put("playbackStopCount", telemetry.playbackStopCount);
                telemetryJson.put("startupCount", telemetry.startupCount);
                telemetryJson.put("lastStartupDurationMs", telemetry.lastStartupDurationMs);
                telemetryJson.put("averageStartupDurationMs", telemetry.averageStartupDurationMs);
                telemetryJson.put("rebufferCount", telemetry.rebufferCount);
                telemetryJson.put("totalBufferingMs", telemetry.totalBufferingMs);
                telemetryJson.put("currentlyBuffering", telemetry.currentlyBuffering);
                telemetryJson.put("playbackErrors", telemetry.playbackErrors);
                telemetryJson.put("networkErrors", telemetry.networkErrors);
                telemetryJson.put("retryCount", telemetry.retryCount);
                telemetryJson.put("fallbackSwitchCount", telemetry.fallbackSwitchCount);
                telemetryJson.put("lastBandwidthKbps", telemetry.lastBandwidthKbps);
                telemetryJson.put("networkBytesTransferred", telemetry.networkBytesTransferred);
                telemetryJson.put("networkCallCount", telemetry.networkCallCount);
                telemetryJson.put("successfulNetworkCallCount", telemetry.successfulNetworkCallCount);
                telemetryJson.put("failedNetworkCallCount", telemetry.failedNetworkCallCount);
                telemetryJson.put("lastHttpStatusCode", telemetry.lastHttpStatusCode);
                telemetryJson.put("lastNetworkCallDurationMs", telemetry.lastNetworkCallDurationMs);
                telemetryJson.put("lastDnsDurationMs", telemetry.lastDnsDurationMs);
                telemetryJson.put("lastConnectDurationMs", telemetry.lastConnectDurationMs);
                telemetryJson.put("lastTlsDurationMs", telemetry.lastTlsDurationMs);
                telemetryJson.put("lastNetworkBytesAtMs", telemetry.lastNetworkBytesAtMs);
                telemetryJson.put("lastNetworkHost", telemetry.lastNetworkHost);
                telemetryJson.put("metadataUpdateCount", telemetry.metadataUpdateCount);
                telemetryJson.put("lastMetadataUpdatedAtMs", telemetry.lastMetadataUpdatedAtMs);
                telemetryJson.put("audioUnderrunCount", telemetry.audioUnderrunCount);
                telemetryJson.put("lastAudioUnderrunAtMs", telemetry.lastAudioUnderrunAtMs);
                telemetryJson.put("lastAudioUnderrunElapsedSinceLastFeedMs", telemetry.lastAudioUnderrunElapsedSinceLastFeedMs);
                telemetryJson.put("watchdogRecoveryCount", telemetry.watchdogRecoveryCount);
                telemetryJson.put("lastWatchdogReason", telemetry.lastWatchdogReason);
                telemetryJson.put("lastPauseReason", telemetry.lastPauseReason);
                telemetryJson.put("lastPlayerState", telemetry.lastPlayerState);
                telemetryJson.put("lastError", telemetry.lastError);
                json.put("telemetry", telemetryJson);
                if (dataRepository != null) {
                    dataRepository.persistTelemetrySnapshot(telemetry);
                }
            }
            if (networkEngine != null) {
                JSONObject networkConfigJson = new JSONObject();
                WxmNetworkConfig activeNetworkConfig = networkEngine.getConfig();
                networkConfigJson.put("userAgent", activeNetworkConfig.getUserAgent());
                networkConfigJson.put("connectTimeoutMs", activeNetworkConfig.getConnectTimeoutMs());
                networkConfigJson.put("readTimeoutMs", activeNetworkConfig.getReadTimeoutMs());
                networkConfigJson.put("writeTimeoutMs", activeNetworkConfig.getWriteTimeoutMs());
                networkConfigJson.put("callTimeoutMs", activeNetworkConfig.getCallTimeoutMs());
                networkConfigJson.put("retryOnConnectionFailure", activeNetworkConfig.isRetryOnConnectionFailure());
                networkConfigJson.put("maxIdleConnections", activeNetworkConfig.getMaxIdleConnections());
                networkConfigJson.put("keepAliveDurationMinutes", activeNetworkConfig.getKeepAliveDurationMinutes());
                json.put("networkConfig", networkConfigJson);
            }
            if (route != null) {
                JSONObject routeJson = new JSONObject();
                routeJson.put("type", route.type.name());
                routeJson.put("label", route.label);
                routeJson.put("immersiveRecommended", route.immersiveRecommended);
                json.put("route", routeJson);
            }
            if (spatial != null) {
                JSONObject spatialJson = new JSONObject();
                spatialJson.put("apiSupported", spatial.apiSupported);
                spatialJson.put("available", spatial.available);
                spatialJson.put("enabled", spatial.enabled);
                spatialJson.put("label", spatial.label);
                json.put("spatial", spatialJson);
            }
            if (dataLayer != null) {
                JSONObject dataLayerJson = new JSONObject();
                dataLayerJson.put("roomReady", dataLayer.roomReady);
                dataLayerJson.put("lastAudioProfilePersistAtMs", dataLayer.lastAudioProfilePersistAtMs);
                dataLayerJson.put("lastPlaybackStatePersistAtMs", dataLayer.lastPlaybackStatePersistAtMs);
                dataLayerJson.put("lastHistoryPersistAtMs", dataLayer.lastHistoryPersistAtMs);
                dataLayerJson.put("lastTelemetryPersistAtMs", dataLayer.lastTelemetryPersistAtMs);
                dataLayerJson.put("streamConfigPersistCount", dataLayer.streamConfigPersistCount);
                dataLayerJson.put("persistenceFailureCount", dataLayer.persistenceFailureCount);
                dataLayerJson.put("lastPersistenceFailureAtMs", dataLayer.lastPersistenceFailureAtMs);
                dataLayerJson.put("lastPersistenceFailure", dataLayer.lastPersistenceFailure);
                json.put("dataLayer", dataLayerJson);
            }
        } catch (JSONException ignored) {
        }
        if (dataRepository != null) {
            WxmStreamSource activeSource = streamEngine != null ? streamEngine.getCurrentSource() : null;
            dataRepository.persistPlaybackState(
                    playbackEngineState,
                    activeSource != null ? activeSource.getId() : null,
                    isPlaying
            );
        }
        WxmBridgeStatusStore.update(json);
    }

    private void registerNoisyReceiver() {
        noisyReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent != null && AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
                    pausePlayback();
                    publishBridgeStatus("route_disconnected");
                }
            }
        };
        try {
            registerReceiver(noisyReceiver, new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY));
            noisyReceiverRegistered = true;
        } catch (Exception ignored) {
            noisyReceiverRegistered = false;
        }
    }

    private void updateMetadataFromCommand(WxmPlaybackCommand command) {
        if (command == null) return;
        if (command.title != null && !command.title.trim().isEmpty()) currentTitle = command.title.trim();
        if (command.artist != null && !command.artist.trim().isEmpty()) currentArtist = command.artist.trim();
        String cover = command.coverUrl;
        if (cover != null) {
            currentCover = cover.trim();
            loadCoverArt(currentCover);
        }
        if (playbackTelemetry != null) {
            playbackTelemetry.recordMetadataUpdate();
        }
        if (dataRepository != null) {
            dataRepository.persistHistoryTrack(currentTitle, currentArtist, currentCover);
        }
    }

    private void updateAudioProfileFromCommand(WxmPlaybackCommand command) {
        if (command == null) return;
        String requestedProfile = command.audioProfile;
        if (requestedProfile == null) return;
        String normalized = requestedProfile.trim().toLowerCase();
        switch (normalized) {
            case "cinema":
            case "club":
            case "live_stage":
            case "voice":
            case "night":
            case "wide":
            case "standard":
                audioProfile = normalized;
                break;
            default:
                audioProfile = "standard";
        }
        applyWxmDspProfile();
    }

    private void updateVolumeFromCommand(WxmPlaybackCommand command) {
        if (command == null) return;
        if (command.hasVolume) {
            currentVolume = Math.max(0f, Math.min(1f, command.volume));
        }
        if (command.hasMuted) {
            isMuted = command.muted;
        }
    }

    private void applyCurrentVolume() {
        if (player != null) {
            player.setVolume(isMuted ? 0f : currentVolume);
        }
    }

    private void persistAudioProfile() {
        if (dataRepository != null) {
            dataRepository.persistAudioProfile(audioProfile, currentVolume, isMuted);
        }
    }

    private void applyAudioProfile() {
        applyWxmDspProfile();
        if (player == null) return;

        int sessionId = player.getAudioSessionId();
        if (sessionId <= 0) return;

        releaseAudioEffects();
        if ("standard".equals(audioProfile)) return;

        try {
            equalizer = new Equalizer(0, sessionId);
            equalizer.setEnabled(true);
        } catch (Exception ignored) {
            equalizer = null;
        }

        try {
            bassBoost = new BassBoost(0, sessionId);
            bassBoost.setEnabled(true);
        } catch (Exception ignored) {
            bassBoost = null;
        }

        try {
            virtualizer = new Virtualizer(0, sessionId);
            virtualizer.setEnabled(true);
        } catch (Exception ignored) {
            virtualizer = null;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                loudnessEnhancer = new LoudnessEnhancer(sessionId);
                loudnessEnhancer.setEnabled(true);
            }
        } catch (Exception ignored) {
            loudnessEnhancer = null;
        }

        configureEqualizer();
        configureBassBoost();
        configureVirtualizer();
        configureLoudness();
    }

    private DefaultRenderersFactory buildRenderersFactory() {
        return new DefaultRenderersFactory(this) {
            @Override
            protected AudioSink buildAudioSink(
                    Context context,
                    boolean enableFloatOutput,
                    boolean enableAudioTrackPlaybackParams
            ) {
                return new DefaultAudioSink.Builder(context)
                        .setAudioProcessors(new AudioProcessor[] { wxmAudioProcessor })
                        .setEnableFloatOutput(false)
                        .setEnableAudioTrackPlaybackParams(enableAudioTrackPlaybackParams)
                        .build();
            }
        };
    }

    private void applyWxmDspProfile() {
        if (wxmAudioProcessor != null) {
            wxmAudioProcessor.setProfile(audioProfile);
        }
    }

    private void configureEqualizer() {
        if (equalizer == null) return;
        try {
            short bands = equalizer.getNumberOfBands();
            if (bands <= 0) return;
            int[] gains = profileEqGains(bands);
            short[] range = equalizer.getBandLevelRange();
            short min = range[0];
            short max = range[1];
            for (short i = 0; i < bands; i++) {
                int gain = gains[Math.min(i, gains.length - 1)];
                short clamped = (short) Math.max(min, Math.min(max, gain));
                equalizer.setBandLevel(i, clamped);
            }
        } catch (Exception ignored) {
        }
    }

    private int[] profileEqGains(short bands) {
        int low = 0;
        int lowMid = 0;
        int mid = 0;
        int highMid = 0;
        int high = 0;

        switch (audioProfile) {
            case "cinema":
                low = 450; lowMid = 120; mid = -80; highMid = 160; high = 260;
                break;
            case "club":
                low = 650; lowMid = 260; mid = -120; highMid = 180; high = 300;
                break;
            case "live_stage":
                low = 260; lowMid = 120; mid = 80; highMid = 260; high = 330;
                break;
            case "voice":
                low = -220; lowMid = -80; mid = 420; highMid = 340; high = 80;
                break;
            case "night":
                low = -120; lowMid = 40; mid = 180; highMid = 60; high = -120;
                break;
            case "wide":
                low = 120; lowMid = 60; mid = -60; highMid = 180; high = 260;
                break;
            default:
                break;
        }

        int[] shaped = new int[Math.max(1, bands)];
        for (int i = 0; i < shaped.length; i++) {
            float position = shaped.length == 1 ? 0.5f : (float) i / (float) (shaped.length - 1);
            if (position < 0.2f) shaped[i] = low;
            else if (position < 0.4f) shaped[i] = lowMid;
            else if (position < 0.6f) shaped[i] = mid;
            else if (position < 0.8f) shaped[i] = highMid;
            else shaped[i] = high;
        }
        return shaped;
    }

    private void configureBassBoost() {
        if (bassBoost == null) return;
        try {
            short strength;
            switch (audioProfile) {
                case "club":
                    strength = 850;
                    break;
                case "cinema":
                    strength = 620;
                    break;
                case "live_stage":
                    strength = 420;
                    break;
                case "night":
                case "voice":
                    strength = 0;
                    break;
                default:
                    strength = 260;
            }
            bassBoost.setStrength(strength);
            bassBoost.setEnabled(strength > 0);
        } catch (Exception ignored) {
        }
    }

    private void configureVirtualizer() {
        if (virtualizer == null) return;
        try {
            boolean immersiveOutput = isImmersiveOutputConnected();
            short strength;
            switch (audioProfile) {
                case "cinema":
                    strength = immersiveOutput ? (short) 820 : (short) 420;
                    break;
                case "live_stage":
                    strength = immersiveOutput ? (short) 720 : (short) 360;
                    break;
                case "wide":
                    strength = immersiveOutput ? (short) 650 : (short) 300;
                    break;
                case "club":
                    strength = immersiveOutput ? (short) 520 : (short) 260;
                    break;
                case "voice":
                case "night":
                    strength = 0;
                    break;
                default:
                    strength = 300;
            }
            virtualizer.setStrength(strength);
            virtualizer.setEnabled(strength > 0);
        } catch (Exception ignored) {
        }
    }

    private boolean isImmersiveOutputConnected() {
        AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (audioManager == null) return false;
        try {
            AudioDeviceInfo[] outputs = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
            for (AudioDeviceInfo device : outputs) {
                int type = device.getType();
                if (type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES
                        || type == AudioDeviceInfo.TYPE_WIRED_HEADSET
                        || type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP
                        || type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO
                        || type == AudioDeviceInfo.TYPE_USB_HEADSET
                        || type == AudioDeviceInfo.TYPE_USB_DEVICE
                        || type == AudioDeviceInfo.TYPE_HDMI) {
                    return true;
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                        && (type == AudioDeviceInfo.TYPE_BLE_HEADSET
                        || type == AudioDeviceInfo.TYPE_BLE_SPEAKER
                        || type == AudioDeviceInfo.TYPE_HEARING_AID)) {
                    return true;
                }
            }
        } catch (Exception ignored) {
        }
        return false;
    }

    private void configureLoudness() {
        if (loudnessEnhancer == null) return;
        try {
            int gainMb;
            switch (audioProfile) {
                case "voice":
                    gainMb = 350;
                    break;
                case "night":
                    gainMb = 180;
                    break;
                case "cinema":
                case "club":
                case "live_stage":
                    gainMb = 120;
                    break;
                default:
                    gainMb = 0;
            }
            loudnessEnhancer.setTargetGain(gainMb);
            loudnessEnhancer.setEnabled(gainMb > 0);
        } catch (Exception ignored) {
        }
    }

    private void releaseAudioEffects() {
        if (equalizer != null) {
            try { equalizer.release(); } catch (Exception ignored) {}
            equalizer = null;
        }
        if (bassBoost != null) {
            try { bassBoost.release(); } catch (Exception ignored) {}
            bassBoost = null;
        }
        if (virtualizer != null) {
            try { virtualizer.release(); } catch (Exception ignored) {}
            virtualizer = null;
        }
        if (loudnessEnhancer != null) {
            try { loudnessEnhancer.release(); } catch (Exception ignored) {}
            loudnessEnhancer = null;
        }
    }

    private void updateMediaSession() {
        if (sessionController == null) return;
        Bitmap art = currentArt != null ? currentArt : stationArt;
        sessionController.update(currentTitle, currentArtist, currentCover, art, isPlaying);
    }

    private void releasePlayer() {
        if (recoveryController != null) {
            recoveryController.cancelPlaybackWatchdog();
        }
        releaseAudioEffects();
        if (player != null) {
            try {
                player.stop();
            } catch (Exception ignored) {
            }
            player.release();
            player = null;
        }
        wxmAudioProcessor = null;
        resetPlaybackWatchdog();
    }

    private void loadCoverArt(String coverUrl) {
        if (artworkLoader == null) return;
        if (coverUrl == null || !coverUrl.startsWith("https://")) {
            currentArt = stationArt;
            return;
        }
        artworkLoader.loadHttpsArtwork(coverUrl, downloaded -> {
            if (downloaded == null) {
                return;
            }
            if (mainHandler == null) {
                return;
            }
            mainHandler.post(() -> {
                currentArt = downloaded;
                updateMediaSession();
                if (isPlaying) {
                    startForeground(NOTIFICATION_ID, buildNotification(true));
                }
            });
        });
    }

    private Notification buildNotification(boolean playing) {
        Bitmap art = currentArt != null ? currentArt : stationArt;
        return notificationController.build(
                playing,
                streamUrl,
                currentTitle,
                currentArtist,
                art,
                sessionController != null ? sessionController.getPlatformSessionToken() : null
        );
    }

    @Override
    public void onDestroy() {
        stopPlayback();
        if (sessionController != null) {
            sessionController.release();
            sessionController = null;
        }
        if (artworkLoader != null) {
            artworkLoader.shutdown();
            artworkLoader = null;
        }
        if (networkMonitor != null) {
            networkMonitor.stop();
            networkMonitor = null;
        }
        if (audioRouteManager != null) {
            audioRouteManager.stop();
            audioRouteManager = null;
        }
        if (noisyReceiverRegistered && noisyReceiver != null) {
            try {
                unregisterReceiver(noisyReceiver);
            } catch (Exception ignored) {
            }
            noisyReceiverRegistered = false;
            noisyReceiver = null;
        }
        if (audioFocusManager != null) {
            audioFocusManager.abandonFocus();
            audioFocusManager = null;
        }
        if (recoveryController != null) {
            recoveryController.shutdown();
            recoveryController = null;
        }
        if (mainHandler != null) {
            mainHandler.removeCallbacksAndMessages(null);
            mainHandler = null;
        }
        super.onDestroy();
    }
}
