package com.wxmoneradio.player;

import java.nio.ByteBuffer;

import androidx.media3.common.C;
import androidx.media3.common.audio.AudioProcessor.AudioFormat;
import androidx.media3.common.audio.BaseAudioProcessor;

public final class WxmAudioProcessor extends BaseAudioProcessor {
    private static final int PCM_16_MAX = 32767;
    private static final float PCM_16_SCALE = 32768f;

    private volatile ProfileSettings settings = ProfileSettings.standard();
    private int channelCount;
    private float bassAlpha = 0.025f;
    private float presenceAlpha = 0.28f;
    private float[] bassState = new float[0];
    private float[] presenceState = new float[0];
    private float[] frameBuffer = new float[0];

    public void setProfile(String profile) {
        settings = ProfileSettings.from(profile);
    }

    @Override
    protected AudioFormat onConfigure(AudioFormat inputAudioFormat) {
        if (inputAudioFormat.encoding != C.ENCODING_PCM_16BIT || inputAudioFormat.channelCount <= 0) {
            return AudioFormat.NOT_SET;
        }
        channelCount = inputAudioFormat.channelCount;
        bassState = new float[channelCount];
        presenceState = new float[channelCount];
        frameBuffer = new float[channelCount];
        bassAlpha = onePoleAlpha(165f, inputAudioFormat.sampleRate);
        presenceAlpha = onePoleAlpha(2400f, inputAudioFormat.sampleRate);
        return inputAudioFormat;
    }

    @Override
    public void queueInput(ByteBuffer inputBuffer) {
        int inputSize = inputBuffer.remaining();
        if (inputSize == 0) return;

        ByteBuffer outputBuffer = replaceOutputBuffer(inputSize);
        ProfileSettings currentSettings = settings;

        if (currentSettings.isPassthrough || channelCount <= 0) {
            outputBuffer.put(inputBuffer);
            outputBuffer.flip();
            return;
        }

        int frameSize = inputAudioFormat.bytesPerFrame;
        int completeInputSize = inputSize - (inputSize % frameSize);
        int frameLimit = inputBuffer.position() + completeInputSize;
        float[] frame = frameBuffer;

        while (inputBuffer.position() < frameLimit) {
            for (int channel = 0; channel < channelCount; channel++) {
                frame[channel] = readPcm16(inputBuffer);
                frame[channel] = toneShape(frame[channel], channel, currentSettings);
            }

            if (channelCount >= 2 && currentSettings.width != 1f) {
                float mid = (frame[0] + frame[1]) * 0.5f;
                float side = (frame[0] - frame[1]) * 0.5f * currentSettings.width;
                frame[0] = mid + side;
                frame[1] = mid - side;
            }

            for (int channel = 0; channel < channelCount; channel++) {
                frame[channel] = softLimit(frame[channel], currentSettings);
                writePcm16(outputBuffer, frame[channel]);
            }
        }

        while (inputBuffer.hasRemaining()) {
            outputBuffer.put(inputBuffer.get());
        }

        outputBuffer.flip();
    }

    @Override
    protected void onFlush() {
        clearFilterState();
    }

    @Override
    protected void onReset() {
        channelCount = 0;
        bassState = new float[0];
        presenceState = new float[0];
        frameBuffer = new float[0];
    }

    private float toneShape(float input, int channel, ProfileSettings currentSettings) {
        bassState[channel] += bassAlpha * (input - bassState[channel]);
        presenceState[channel] += presenceAlpha * (input - presenceState[channel]);

        float bass = bassState[channel];
        float presence = input - presenceState[channel];
        float shaped = input
                + (bass * currentSettings.bassGain)
                + (presence * currentSettings.presenceGain);

        if (currentSettings.compression > 0f) {
            float abs = Math.abs(shaped);
            float threshold = currentSettings.compressionThreshold;
            if (abs > threshold) {
                float over = abs - threshold;
                shaped = Math.copySign(threshold + (over * (1f - currentSettings.compression)), shaped);
            }
        }

        return shaped * currentSettings.outputGain;
    }

    private float softLimit(float input, ProfileSettings currentSettings) {
        float driven = input * (1f + currentSettings.limiterDrive);
        float limited = driven / (1f + Math.abs(driven) * currentSettings.limiterDrive);
        if (limited > 0.98f) return 0.98f;
        if (limited < -0.98f) return -0.98f;
        return limited;
    }

    private float readPcm16(ByteBuffer buffer) {
        int low = buffer.get() & 0xFF;
        int high = buffer.get();
        short sample = (short) ((high << 8) | low);
        return sample / PCM_16_SCALE;
    }

    private void writePcm16(ByteBuffer buffer, float sample) {
        int pcm = Math.round(sample * PCM_16_MAX);
        if (pcm > PCM_16_MAX) pcm = PCM_16_MAX;
        if (pcm < -PCM_16_MAX - 1) pcm = -PCM_16_MAX - 1;
        buffer.put((byte) (pcm & 0xFF));
        buffer.put((byte) ((pcm >> 8) & 0xFF));
    }

    private void clearFilterState() {
        for (int i = 0; i < bassState.length; i++) {
            bassState[i] = 0f;
        }
        for (int i = 0; i < presenceState.length; i++) {
            presenceState[i] = 0f;
        }
    }

    private float onePoleAlpha(float cutoffHz, int sampleRate) {
        if (sampleRate <= 0) return 0.025f;
        float alpha = (float) ((2.0 * Math.PI * cutoffHz) / sampleRate);
        if (alpha < 0.001f) return 0.001f;
        if (alpha > 0.35f) return 0.35f;
        return alpha;
    }

    private static final class ProfileSettings {
        final boolean isPassthrough;
        final float width;
        final float bassGain;
        final float presenceGain;
        final float outputGain;
        final float limiterDrive;
        final float compression;
        final float compressionThreshold;

        private ProfileSettings(
                boolean isPassthrough,
                float width,
                float bassGain,
                float presenceGain,
                float outputGain,
                float limiterDrive,
                float compression,
                float compressionThreshold
        ) {
            this.isPassthrough = isPassthrough;
            this.width = width;
            this.bassGain = bassGain;
            this.presenceGain = presenceGain;
            this.outputGain = outputGain;
            this.limiterDrive = limiterDrive;
            this.compression = compression;
            this.compressionThreshold = compressionThreshold;
        }

        static ProfileSettings standard() {
            return new ProfileSettings(true, 1f, 0f, 0f, 1f, 0f, 0f, 0.7f);
        }

        static ProfileSettings from(String profile) {
            if (profile == null) return standard();
            switch (profile) {
                case "cinema":
                    return new ProfileSettings(false, 1.16f, 0.08f, 0.04f, 0.93f, 0.18f, 0.16f, 0.66f);
                case "club":
                    return new ProfileSettings(false, 1.10f, 0.16f, 0.03f, 0.91f, 0.22f, 0.12f, 0.68f);
                case "live_stage":
                    return new ProfileSettings(false, 1.22f, 0.06f, 0.08f, 0.92f, 0.16f, 0.10f, 0.68f);
                case "voice":
                    return new ProfileSettings(false, 1.00f, -0.08f, 0.18f, 0.94f, 0.12f, 0.10f, 0.62f);
                case "night":
                    return new ProfileSettings(false, 1.03f, -0.03f, -0.02f, 0.82f, 0.26f, 0.34f, 0.48f);
                case "wide":
                    return new ProfileSettings(false, 1.28f, 0.02f, 0.06f, 0.90f, 0.18f, 0.08f, 0.70f);
                default:
                    return standard();
            }
        }
    }
}
