package com.wxmoneradio.player.network;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

public final class WxmHttpsOnlyInterceptor implements Interceptor {
    @Override
    public Response intercept(Chain chain) throws IOException {
        Request request = chain.request();
        if (!"https".equalsIgnoreCase(request.url().scheme())) {
            throw new IOException("Cleartext or unsupported scheme blocked");
        }
        return chain.proceed(request);
    }
}
