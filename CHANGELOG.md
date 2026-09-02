# CHANGELOG

## 0.1.0 — 2026-09-02
- Phase 0 discovery (DISCOVERY.md); legacy WARN-notice site decommissioned with backups.
- New standalone app: Next.js 16, Drizzle + PostGIS schema (sources, runs, coverage, raw records, events, locations, lookups, signups, contact, bot traps, audit), migrations + seed of the 14-source catalog.
- Routes: home, /check (address → geocode → jurisdiction → coverage preview with registry official-links card, crime coverage states, other sources, email capture), /sources, /methodology, /pricing, /alerts, /about, /contact, /privacy, /terms, /disclaimers, /counties/[slug], /topics/[slug], /admin/sources; APIs: health, address/resolve, coverage, signup, contact, admin/sources.
- Bot protection (honeypot + timing token + rate limits), strict CSP, structured logs, env validation.
- BullMQ worker with heartbeat + freshness recompute; Compose stack bound to 127.0.0.1:3020; staging nginx template; deploy script.
