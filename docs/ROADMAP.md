# WXM Enterprise Suite Roadmap

## Phase 0 - Governance

- Single source of truth in `Reprov2_NEXTGEN`.
- GitHub repository as official source.
- `main`, `dev`, `feature/*` branch strategy.
- CI and release checklist active.

## Phase 1 - Mobile Radio Experience

- Premium radio home.
- Compact live player.
- Program schedule.
- Song history.
- Favorites.
- Trust and contact screens.

## Phase 2 - Native Android Playback

- Media3/ExoPlayer playback.
- Foreground service.
- MediaSession.
- Lock screen controls.
- Background audio.
- DSP profile foundation.

## Phase 3 - CMS / CMC

- Local CMS dashboard.
- CMS JSON contract.
- Feature flags.
- Editorial content.
- Visual config.
- Audio experience config.

## Phase 4 - Analytics

- Local analytics console.
- Remote analytics starter.
- Countries, players and referrers.
- Live connections.
- World Atlas dashboard.

## Phase 5 - Remote Admin

- Protected admin login.
- CMS JSON publishing.
- Upload handling.
- Analytics summary.
- Future roles and audit trail.

## Phase 6 - Enterprise Modules

- CRM.
- News manager.
- Advertising.
- User management.
- AI services.
- MCP-compatible service layer.

## Phase 7 - Platform Hardening

- Database-backed CMS.
- Production auth and RBAC.
- Observability.
- Backups and rollback.
- Release automation.

## Immediate Stabilization Track

Before expanding CRM, advertising or AI services:

- Keep the World Atlas stable and readable.
- Run interface smoke checks on every UI change.
- Consolidate active CMS vs legacy mirror discipline.
- Connect analytics to persistent backend data.
- Harden Remote Admin auth, uploads, CSRF and audit trail.
