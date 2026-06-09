package com.wxmoneradio.player.network;

import android.util.Log;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

public final class WxmSafeLoggingInterceptor implements Interceptor {
    private static final String TAG = "WxmNetwork";
    private final boolean enabled;

    public WxmSafeLoggingInterceptor(boolean enabled) {
        this.enabled = enabled;
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        Request request = chain.request();
        long startedAt = System.nanoTime();
        if (enabled) {
            Log.d(TAG, "request " + request.method() + " " + sanitizedTarget(request));
        }
        try {
            Response response = chain.proceed(request);
            if (enabled) {
                long elapsedMs = nanosToMs(System.nanoTime() - startedAt);
                Log.d(TAG, "response " + response.code() + " " + elapsedMs + "ms " + sanitizedTarget(request));
            }
            return response;
        } catch (IOException error) {
            if (enabled) {
                long elapsedMs = nanosToMs(System.nanoTime() - startedAt);
                Log.d(TAG, "failure " + error.getClass().getSimpleName() + " " + elapsedMs + "ms " + sanitizedTarget(request));
            }
            throw error;
        }
    }

    private String sanitizedTarget(Request request) {
        return request.url().scheme() + "://" + request.url().host() + request.url().encodedPath();
    }

    private long nanosToMs(long nanos) {
        return nanos <= 0L ? 0L : nanos / 1_000_000L;
    }
}
