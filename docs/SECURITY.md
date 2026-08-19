# WXM Security Requirements

## Baseline

- No secrets in Git.
- No APKs or build artifacts in Git.
- HTTPS required for production APIs, CMS JSON, metadata and streams.
- Admin APIs require authentication.
- Admin sessions must use secure cookies in production.

## Web / CMS

- Render remote content with safe DOM APIs.
- Do not inject remote HTML.
- Validate all image URLs and stream URLs.
- Keep CSP strict when deployed.
- Protect admin mutations from CSRF.
- Restrict upload MIME types and size.
- Rate-limit admin login attempts.
- Keep admin audit logs pseudonymous; never store raw IP in audit UI.
- Expose operational status without leaking filesystem paths or secrets.

## Android

- Block cleartext traffic unless explicitly needed for local development.
- Use least-privilege permissions.
- Keep WebView bridge methods minimal and validated.
- Do not expose secrets to the WebView.
- Avoid logging sensitive data.

## Analytics

- Use anonymous or pseudonymous identifiers.
- Store aggregated country/player/referrer metrics.
- Do not expose raw user identifiers in CMS dashboards.

## Pre-Commit Checks

- `git status --short`
- JavaScript syntax checks.
- Android debug build when Android code or assets change.
- Secret guard.
- Release checklist for APK publishing.
