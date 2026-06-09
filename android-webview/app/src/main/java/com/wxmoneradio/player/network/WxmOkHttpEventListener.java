package com.wxmoneradio.player.network;

import com.wxmoneradio.player.telemetry.WxmPlaybackTelemetry;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import okhttp3.Call;
import okhttp3.EventListener;
import okhttp3.Handshake;
import okhttp3.Response;

public final class WxmOkHttpEventListener extends EventListener {
    private final WxmPlaybackTelemetry telemetry;
    private final ConcurrentHashMap<Call, Trace> traces = new ConcurrentHashMap<>();

    public WxmOkHttpEventListener(WxmPlaybackTelemetry telemetry) {
        this.telemetry = telemetry;
    }

    @Override
    public void callStart(Call call) {
        traces.put(call, new Trace(System.nanoTime(), call.request().url().host()));
        if (telemetry != null) {
            telemetry.recordNetworkCallStarted(call.request().url().host());
        }
    }

    @Override
    public void dnsStart(Call call, String domainName) {
        Trace trace = traces.get(call);
        if (trace != null) {
            trace.dnsStartedAtNs = System.nanoTime();
        }
    }

    @Override
    public void dnsEnd(Call call, String domainName, List<InetAddress> inetAddressList) {
        Trace trace = traces.get(call);
        if (trace != null && trace.dnsStartedAtNs != 0L) {
            trace.dnsDurationMs = nanosToMs(System.nanoTime() - trace.dnsStartedAtNs);
        }
    }

    @Override
    public void connectStart(Call call, InetSocketAddress inetSocketAddress, Proxy proxy) {
        Trace trace = traces.get(call);
        if (trace != null) {
            trace.connectStartedAtNs = System.nanoTime();
        }
    }

    @Override
    public void secureConnectStart(Call call) {
        Trace trace = traces.get(call);
        if (trace != null) {
            trace.tlsStartedAtNs = System.nanoTime();
        }
    }

    @Override
    public void secureConnectEnd(Call call, Handshake handshake) {
        Trace trace = traces.get(call);
        if (trace != null && trace.tlsStartedAtNs != 0L) {
            trace.tlsDurationMs = nanosToMs(System.nanoTime() - trace.tlsStartedAtNs);
        }
    }

    @Override
    public void connectEnd(Call call, InetSocketAddress inetSocketAddress, Proxy proxy, okhttp3.Protocol protocol) {
        Trace trace = traces.get(call);
        if (trace != null && trace.connectStartedAtNs != 0L) {
            trace.connectDurationMs = nanosToMs(System.nanoTime() - trace.connectStartedAtNs);
        }
    }

    @Override
    public void responseHeadersEnd(Call call, Response response) {
        Trace trace = traces.get(call);
        if (trace != null) {
            trace.httpStatusCode = response.code();
        }
    }

    @Override
    public void callEnd(Call call) {
        Trace trace = traces.remove(call);
        if (trace != null && telemetry != null) {
            telemetry.recordNetworkCallFinished(
                    trace.host,
                    trace.httpStatusCode,
                    nanosToMs(System.nanoTime() - trace.callStartedAtNs),
                    trace.dnsDurationMs,
                    trace.connectDurationMs,
                    trace.tlsDurationMs,
                    true);
        }
    }

    @Override
    public void callFailed(Call call, IOException ioe) {
        Trace trace = traces.remove(call);
        if (trace != null && telemetry != null) {
            telemetry.recordNetworkCallFinished(
                    trace.host,
                    trace.httpStatusCode,
                    nanosToMs(System.nanoTime() - trace.callStartedAtNs),
                    trace.dnsDurationMs,
                    trace.connectDurationMs,
                    trace.tlsDurationMs,
                    false);
        }
    }

    private long nanosToMs(long nanos) {
        return nanos <= 0L ? 0L : nanos / 1_000_000L;
    }

    private static final class Trace {
        final long callStartedAtNs;
        final String host;
        long dnsStartedAtNs;
        long connectStartedAtNs;
        long tlsStartedAtNs;
        long dnsDurationMs;
        long connectDurationMs;
        long tlsDurationMs;
        int httpStatusCode;

        Trace(long callStartedAtNs, String host) {
            this.callStartedAtNs = callStartedAtNs;
            this.host = host == null ? "" : host;
        }
    }
}
