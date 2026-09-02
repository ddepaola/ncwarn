# PLAN.md — NC Risk Radar delivery plan

Status: 2026-09-02. Phase 0 complete; Phase 1 + first slice of Phase 2 in this commit.

## Milestones

| # | Milestone | Scope | Depends on | Acceptance |
|---|---|---|---|---|
| 0 | Discovery | DISCOVERY.md, decommission of legacy site | — | ✅ done |
| 1 | Parallel foundation | Repo, Compose stack (`ncriskradar`, 127.0.0.1:3020), PostGIS DB `ncriskradar`, migrations, env validation, structured logs, health, tests, staging vhost + cert, runbook | DNS `staging.ncwarn.com` ✅ | `https://staging.ncwarn.com/api/health` = ok; tests/typecheck/lint green |
| 2 | First vertical slice | Address entry → Census geocode → jurisdiction/coverage → free preview; registry official-links card; coverage/freshness display; email capture (honeypot); admin source health; **one authorized crime source (CMPD)** | 1; CMPD terms review | Handoff §15.3 scenarios 1–4, 10, 12 on staging |
| 3 | Reports & watches | Auth.js magic link, paid report snapshot + PDF (Chromium worker), Stripe test-mode + verified webhooks, watches, notification worker, entitlements | 2; Stripe account, email provider decision | §15.3 scenarios 5–9, 11, 13 |
| 4 | Property & development intelligence | Union/Meck planning agendas, NCDOT, NC DEQ, FIMAN, hearings/deadlines | 3; per-source terms decisions | Every published fact has provenance + freshness |
| 5 | Production cutover | Freeze, backup, acceptance checklist, flip `ncwarn.conf` upstream 3017→3020, verify, rollback window | 3 (min) | Rollback = one-line nginx revert |

## Phase 2 remaining work (next)
1. **CMPD Incidents adapter** — confirm the documented ArcGIS/Socrata endpoint on data.charlottenc.gov, record terms in DATA_SOURCES.md, build fetch/parse/validate/normalize with fixtures + contract test, ST_DWithin radius queries (½/1/3 mi × 30/90/365 d), category totals, own-period trend, coverage warning for non-CMPD Mecklenburg agencies.
2. Wire the crime card to real data with precision-preserving map markers (MapLibre) + list view.
3. Worker: `source-run` job type with idempotent upsert (external id → content hash), `source_runs` bookkeeping, freshness updates.
4. Admin: manual re-run, quarantine list, suppress/correct with audit log.
5. E2E tests (Playwright) for search → preview → signup; accessibility check on `/`, `/check`.

## Risks
- **Docker ports bypass ufw** on the shared VPS (see SECURITY.md) — other apps are exposed; ours binds 127.0.0.1 only. Needs a host firewall fix (Dominick's approval).
- Census geocoder: keyless and permitted, but no SLA; add a cached fallback provider before launch (decision §20).
- Source terms: several agencies lack reusable feeds; the UI shows "coverage not available" rather than scraping.
- Shared host Postgres: one restart affects ~17 apps; schedule maintenance windows.
- Email deliverability via VPS Postfix/SendGrid relay untested for this domain (DKIM key exists).

## Decisions needed from Dominick
- Map tiles/geocoding provider for production (MapLibre + which tile/geocode vendor).
- Email provider vs. Postfix relay (SendGrid already relays on the host).
- Stripe account + final prices; NextHome Providence branding on reports or neutral.
- Legal review of terms/privacy/disclaimers/registry wording/correction policy.
- Firewall fix for Docker-published ports (SECURITY.md §1) and sshd hardening.
