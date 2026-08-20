# WXM API Contract

## Public CMS Contract

The app consumes a public CMS/CMC JSON document.

Required principles:

- HTTPS in production.
- No secrets.
- No admin endpoints.
- Strictly validated URLs.
- Safe image sources: hosted HTTPS or packaged assets.
- Feature flags controlled by CMS.

Main sections:

```text
station
stream
metadata
features
visual
audioExperience
content
analytics
homeRails
exploreRails
rails
```

## Remote Admin APIs

Admin APIs belong to `cms-remote-starter` and must be protected by authentication.

Current starter endpoints:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/status
GET  /api/admin/status
GET  /api/admin/audit
GET  /api/admin/storage
POST /api/admin/snapshot
GET  /api/cms/current
POST /api/cms/publish
GET  /api/cms/revisions
POST /api/cms/rollback
POST /api/assets/upload
GET  /api/assets/list
GET  /api/analytics/summary
POST /api/analytics/ingest
GET  /api/stream/shoutcast/summary
GET  /wxm-cms.json
GET  /health
```

Admin mutations must send the session CSRF token:

```text
X-WXM-CSRF: <csrfToken>
```

The token is returned by:

```text
POST /api/auth/login
GET  /api/auth/status
```

## Remote Storage Contract

The remote CMS exposes a protected storage health contract for operational dashboards:

```text
GET /api/admin/storage
```

Response shape:

```json
{
  "ok": true,
  "health": {
    "ok": true,
    "checks": [
      { "name": "write_access", "ok": true, "value": "ok" }
    ]
  },
  "manifest": {
    "schemaVersion": 1,
    "mode": "local-file-store",
    "currentCms": { "exists": true, "bytes": 1200, "sha256": "..." },
    "revisions": { "files": 8, "bytes": 9000 },
    "analytics": { "files": 3, "bytes": 4500 },
    "audit": { "exists": true, "bytes": 800 },
    "uploads": { "files": 12, "bytes": 900000 }
  },
  "snapshots": []
}
```

Manual snapshots are created through:

```text
POST /api/admin/snapshot
```

Payload:

```json
{
  "label": "before-stream-change",
  "reason": "manual backup",
  "includeAnalyticsSummary": true
}
```

This endpoint requires authentication and `X-WXM-CSRF`.

## Stream Provider APIs

The remote backend can read streaming-provider telemetry server-side. These APIs are private admin endpoints and must never be exposed in the public CMS JSON consumed by the Android/Web app.

```text
GET /api/stream/shoutcast/summary
```

Response shape:

```json
{
  "ok": true,
  "provider": "shoutcast-dnas",
  "source": {
    "baseUrl": "http://jm8n.net:8024",
    "authMode": "basic",
    "primarySid": "1",
    "sids": ["1", "5"]
  },
  "totals": {
    "totalStreams": 2,
    "activeStreams": 2,
    "currentListeners": 9,
    "peakListeners": 62,
    "uniqueListeners": 8
  },
  "streams": [
    {
      "id": "1",
      "role": "primary",
      "path": "/stream",
      "content": "audio/aacp",
      "currentListeners": 9,
      "peakListeners": 47,
      "songTitle": "Artist - Title",
      "hasAuthhash": true,
      "authhash": "abcd...1234"
    }
  ]
}
```

Security rules:

- `WXM_SHOUTCAST_ADMIN_PASSWORD` and any full authhash values are server secrets.
- The Android app, public website and `/wxm-cms.json` must never receive DNAS admin URLs, Basic Auth credentials or full authhashes.
- The endpoint may use HTTP internally only if the DNAS provider is HTTP-only; the CMS Remote Admin itself must be served over HTTPS in production.

## Analytics Events

Analytics must be anonymous and aggregated.

Allowed fields:

```text
eventType
sourceClient
player
country
city
referrer
networkScore
durationSeconds
streamId
timestamp
anonId
```

Do not send names, emails, phone numbers, exact GPS location or raw IP addresses.

## Future MCP-Compatible Tools

Services should be designed so these tools can be added later:

```text
getListeners()
getCountries()
getCities()
getAnalytics()
getStreams()
getNews()
getAds()
getUsers()
```
