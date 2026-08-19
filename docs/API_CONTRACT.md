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
GET  /api/cms/current
POST /api/cms/publish
GET  /api/cms/revisions
POST /api/cms/rollback
POST /api/assets/upload
GET  /api/assets/list
GET  /api/analytics/summary
POST /api/analytics/ingest
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
