# CHANGELOG

## 0.3.1 — 2026-09-04
- Site imagery generated and shipped: home hero, four pillar icons (WebP), Open Graph card (JPEG); 95 KB total, `next/image` with `unoptimized` so no sharp dependency is introduced.
- Fixed: `APP_URL` never reached `docker build`, so Next baked `http://localhost:3000` into every `og:image`/canonical URL and the staging `noindex` rule silently never applied. It is now a build arg in `Dockerfile`/`docker-compose.yml`, and `deploy/deploy.sh` exports it from `.env` before building.
- Fixed: `/api/health` always reported `version: "dev"` — `ARG` does not cross Docker stages, so `APP_VERSION` is now redeclared in the runner stage and reports the deployed commit.

## 0.3.0 — 2026-09-02
- Admin review tools: per-source detail page (`/admin/sources/[key]`) with run history, quarantined records (validation failures now stored with reasons instead of being dropped; migration 0002) and reviewer notes, and suppressions (hide one agency record from all public output, audit-logged, liftable).
- Crime list view shows the agency report number so corrections can reference it.
- Methodology v0.2: full description of the crime card rules (counting, data-through, trends, precision, coverage, re-imports).
- Playwright smoke suite (`npm run e2e`, `E2E_BASE_URL=…`): home, health, Charlotte check flow with real crime card, outside-NC message, admin 401, honeypot rejection, public pages.
- Optional site imagery slots (`public/images/*`, see README there): home hero, pillar icons, Open Graph card; pages degrade gracefully when files are absent.

## 0.2.0 — 2026-09-02
- CMPD Incidents source integrated (terms reviewed → permitted; see DATA_SOURCES.md): ArcGIS adapter with pagination, validation, NIBRS→category mapping (800-series flagged non-criminal), content-hash change detection, idempotent upsert into `crime_incidents` (migration 0001), evidence in `raw_records`, run bookkeeping + coverage/freshness updates, 760-day backfill then 7-day-overlap incremental runs every 6h (worker `source-run` job).
- /check crime card now shows real radius counts (0.5/1/3 mi × 30/90/365 days), per-category table with the address's own preceding period, own-period trend (withheld when history incomplete or baseline is zero), recent-incident list view, "data through" date, non-criminal exclusion note, and a "coverage not available" notice for non-CMPD Mecklenburg towns.
- Admin: "Run import now" (optional since-date) → `POST /api/admin/sources/[key]/run`, audit-logged.
- Tests: NIBRS mapping, CMPD adapter contract (fixture page), query URL builder, content hash.

## 0.1.0 — 2026-09-02
- Phase 0 discovery (DISCOVERY.md); legacy WARN-notice site decommissioned with backups.
- New standalone app: Next.js 16, Drizzle + PostGIS schema (sources, runs, coverage, raw records, events, locations, lookups, signups, contact, bot traps, audit), migrations + seed of the 14-source catalog.
- Routes: home, /check (address → geocode → jurisdiction → coverage preview with registry official-links card, crime coverage states, other sources, email capture), /sources, /methodology, /pricing, /alerts, /about, /contact, /privacy, /terms, /disclaimers, /counties/[slug], /topics/[slug], /admin/sources; APIs: health, address/resolve, coverage, signup, contact, admin/sources.
- Bot protection (honeypot + timing token + rate limits), strict CSP, structured logs, env validation.
- BullMQ worker with heartbeat + freshness recompute; Compose stack bound to 127.0.0.1:3020; staging nginx template; deploy script.
