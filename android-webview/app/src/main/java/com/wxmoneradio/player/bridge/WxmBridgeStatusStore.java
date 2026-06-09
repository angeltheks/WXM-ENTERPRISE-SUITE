package com.wxmoneradio.player.bridge;

import org.json.JSONException;
import org.json.JSONObject;

public final class WxmBridgeStatusStore {
    private static JSONObject current = new JSONObject();

    private WxmBridgeStatusStore() {
    }

    public static synchronized void update(JSONObject status) {
        current = status == null ? new JSONObject() : status;
    }

    public static synchronized String getJson() {
        return current.toString();
    }

    public static JSONObject base(String state) {
        JSONObject json = new JSONObject();
        try {
            json.put("state", state == null ? "unknown" : state);
            json.put("updatedAt", System.currentTimeMillis());
        } catch (JSONException ignored) {
        }
        return json;
    }
}
