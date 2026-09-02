# CHANGELOG

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
