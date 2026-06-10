# WXM Enterprise Suite Architecture

## Source Of Truth

The official project is:

```text
/Users/mac/AndroidProjects/Reprov2_NEXTGEN
```

The official repository is:

```text
angeltheks/WXM-ENTERPRISE-SUITE
```

Historical folders must not be used for active development.

## Current Runtime Layout

The current physical layout is intentionally preserved until a controlled migration is scheduled:

```text
android-webview/        Android native shell, WebView bridge, Media3/ExoPlayer, services and DSP.
v2/                     Web/mobile UI shipped inside Android assets.
v2/cms/                 Local CMS dashboard and analytics console.
cms-remote-starter/     Remote CMS starter: auth, CMS JSON, uploads, analytics APIs.
scripts/                Build and asset sync helpers.
docs/                   Architecture and operating documentation.
```

## Target Monorepo Layout

The long-term enterprise layout is:

```text
apps/
  android-webview/
  mobile-ui/
cms/
  local-dashboard/
  remote-backend/
analytics/
crm/
streaming/
shared/
  ui/
  types/
  services/
  utilities/
infrastructure/
scripts/
docs/
```

Do not move runtime folders until imports, asset paths, Android packaging and CI are migrated in one controlled refactor.

## Architectural Layers

```text
Mobile UI / WebView
Android Bridge
Playback Engine
Streaming Engine
Network / Buffer / Retry
Audio Focus / Media Session
DSP / Audio Profiles
CMS Contract
Analytics Ingest
Remote Admin / Backend
```

## Rules

- Refactor before duplicating.
- Prefer shared modules when behavior is reused across app, CMS and remote backend.
- Keep `main` stable and develop on `dev` or `feature/*`.
- Document any architecture change in `docs/` and `MCP.md`.

