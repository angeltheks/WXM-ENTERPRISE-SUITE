# WXM ENTERPRISE SUITE - Project Context

## Single Source Of Truth

The only official active project is:

```text
/Users/mac/AndroidProjects/Reprov2_NEXTGEN
```

Historical backups only:

```text
/Users/mac/AndroidProjects/Reprov2
/Users/mac/Desktop/Reprov2
```

Do not develop in historical folders. If legacy files are needed, compare versions, verify differences, migrate only the required file, and commit the migration in the official repository.

## Official Repository

```text
angeltheks/WXM-ENTERPRISE-SUITE
```

GitHub is the single source of truth for development, documentation, fixes, and releases.

## Branching Strategy

```text
main       Production-ready stable version.
dev        Daily development branch.
feature/*  Major feature branches.
```

Never develop directly on `main`.

## Product Objective

WXM ENTERPRISE SUITE is a professional radio platform combining:

- Radio CMS.
- CRM.
- Analytics.
- Streaming management.
- News management.
- Advertising.
- User management.
- AI services.
- World Atlas Dashboard.

The project must stay modular, secure, and ready for future MCP-compatible service tools.

## Current Operational State

As of 2026-08-27, the active closure track is CMS Remote + CMS Local + Android App integration.

- `scripts/smoke-check.sh` validates entry points, Git hygiene, secret guard, JSON contracts, JavaScript syntax and interface contracts.
- `scripts/interface-smoke.mjs` guards app UI, CMS UI, World Atlas and CMS Remote Admin contracts.
- `scripts/start-remote-cms.sh` starts the Remote Admin with global Node or the bundled Codex Node runtime.
- CMS local has visible SHOUTcast navigation and keeps private SHOUTcast work behind Remote Admin.
- CMS Remote Starter includes login, CSRF, audit, snapshots, rollback, asset upload, anonymous analytics and SHOUTcast summary endpoint.
- Android app remains the production mobile target and must consume remote CMS with local fallback/cache.

Current plan:

```text
docs/CMS_REMOTE_LOCAL_APP_COMPLETION_PLAN.md
```

Next recommended phase: finish Phase A/B operational polish, then connect real SHOUTcast + app analytics before expanding CRM, advertising or AI services.
