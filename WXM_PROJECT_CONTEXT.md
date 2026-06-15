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

As of 2026-06-15, phase `0.6 - Auditoria Operativa De Continuidad` is complete.

- `scripts/smoke-check.sh` validates entry points, Git hygiene, secret guard, JSON contracts and JavaScript syntax.
- CI runs the smoke check before Android debug build.
- Android APK build is validated with the Gradle Wrapper.
- CMS Remote Starter responds to `HEAD` and `GET` on critical public routes.
- Current audit report lives in `docs/CURRENT_STATE_AUDIT.md`.

Next recommended phase: `0.7 - Smoke Visual Y Consolidacion De Copias CMS`.
