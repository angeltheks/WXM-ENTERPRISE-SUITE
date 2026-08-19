# WXM Database Plan

## Current State

The current remote starter uses a formal local file storage adapter:

```text
cms-remote-starter/lib/storage.js
```

This adapter is the phase 5.2 persistence boundary. It is still not the final production database, but it centralizes storage behavior so the project can migrate to SQLite/Postgres without rewriting all routes.

Runtime data must stay ignored by Git:

```text
cms-remote-starter/data/
cms-remote-starter/public/uploads/
```

## Local File Store Layout

```text
data/
  current/wxm-cms.json
  revisions/wxm-cms-*.json
  analytics/*.ndjson
  audit/admin.ndjson
  snapshots/snapshot-*.json
  storage-manifest.json

public/uploads/
  YYYY/MM/*.png|jpg|webp
```

The adapter provides:

- atomic writes;
- NDJSON append;
- revision listing;
- analytics file listing;
- storage manifest;
- storage health checks;
- manual snapshots;
- automatic snapshots after CMS publish/rollback.

Protected operational APIs:

```text
GET  /api/admin/storage
POST /api/admin/snapshot
```

## What This Solves

- The CMS has an explicit persistence boundary.
- Admin can inspect health and snapshots from the remote panel.
- Publish and rollback have point-in-time backups.
- Analytics and audit logs remain pseudonymous.
- Future MCP tools can read from a stable storage contract.

## What This Does Not Solve Yet

- Multi-admin users.
- RBAC.
- SQL queries.
- Concurrent write locking across multiple server instances.
- Long-term analytics warehouse.
- Offsite backup.
- Point-in-time restore from a production database.

## Production Database Goals

Recommended production entities:

```text
users
roles
sessions
cms_revisions
assets
programs
presenters
news
ads
streams
analytics_events
analytics_aggregates
audit_logs
```

Recommended migration path:

1. Keep `WxmFileStore` as the interface contract.
2. Add `WxmSqliteStore` for single-server hosting.
3. Add `WxmPostgresStore` for multi-server production.
4. Keep public `wxm-cms.json` generated from validated database records.
5. Move analytics to append-only events plus aggregate tables.
6. Move audit logs to immutable append-only storage with retention policy.

## Rules

- Do not store raw IP addresses unless there is a clear legal basis and retention policy.
- Prefer aggregated analytics for dashboard views.
- Add audit logs for admin publishing, stream changes and emergency mode.
- Keep public CMS JSON generated from validated database records.
