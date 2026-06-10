# WXM Database Plan

## Current State

The current remote starter uses lightweight local runtime storage for development. This is not a final production database.

Runtime data must stay ignored by Git:

```text
cms-remote-starter/data/
cms-remote-starter/public/uploads/
```

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

## Rules

- Do not store raw IP addresses unless there is a clear legal basis and retention policy.
- Prefer aggregated analytics for dashboard views.
- Add audit logs for admin publishing, stream changes and emergency mode.
- Keep public CMS JSON generated from validated database records.

