# DECISIONS.md

| Date | Decision | Why |
|---|---|---|
| 2026-09-02 | Process manager = **Docker Compose** (`restart: unless-stopped`), not PM2/systemd | Matches every other app on the VPS; PM2 is installed but unused. Handoff allows "existing convention after inspection". |
| 2026-09-02 | Names: dir `/home/ncwarn/nc-risk-radar`, compose project `ncriskradar`, port **127.0.0.1:3020**, DB/role `ncriskradar`, hostname `staging.ncwarn.com` | No collision with anything on the host; web is reachable only through nginx. |
| 2026-09-02 | Legacy WARN-notice site destroyed (backup `/home/backups/ncwarn-legacy-2026-09-02/`, git `legacy-warn-site`); GitHub repo `ddepaola/ncwarn` reused with a new `main` | Dominick's call: clean-slate rebuild. |
| 2026-09-02 | Typed DB layer = **Drizzle ORM** + `postgres` driver (not Prisma) | Prisma needs engine binaries downloaded at install (blocked in the build sandbox) and is awkward with PostGIS; Drizzle is SQL-first with native `geometry`/custom `geography` types and plain SQL migrations. Handoff permits "another appropriate typed database layer". |
| 2026-09-02 | Geocoder (MVP) = **U.S. Census Bureau Geocoder** behind a provider interface | Keyless, permitted, returns county FIPS + place in one call. Production vendor to be chosen (handoff §20). |
| 2026-09-02 | Dedicated Redis container per stack (`ncriskradar-redis`), BullMQ prefix `ncrr`, ioredis key prefix `ncrr:` | Matches host convention; no dependency on the host Redis credential; namespaced anyway. |
| 2026-09-02 | Admin auth (interim) = HTTP Basic with `ADMIN_TOKEN` enforced in `src/proxy.ts` + noindex | Auth.js arrives in Milestone 3; server-side enforcement from day one. |
| 2026-09-02 | Bot protection = honeypot field + signed timing token + Redis rate limit; **no CAPTCHA** | Handoff: bot protection must not block accessibility; NCSBI CAPTCHA must never be defeated (different concern, same principle). |
| 2026-09-02 | No Google Fonts / third-party scripts; strict CSP | Privacy-conscious analytics only; CSP `default-src 'self'`. |
| 2026-09-02 | `NODE_ENV` is not read from `.env` (set by the Dockerfile) | A dev value in `.env` breaks `next build`. |

## 2026-09-02 — CMPD ingestion & crime card
- **Backfill window 760 days** (365-day range + equal preceding period + slack) rather than the full 2017+ history: keeps the table ~190k rows and the first import ~2 min; older history can be added with an admin "since" run if a product need appears.
- **Own-period trend only, withheld when incomplete**: a trend percentage is shown only when the imported history fully covers both the current and the preceding window and the baseline is non-zero. No neighborhood comparisons, no score.
- **Non-criminal NIBRS 8xx records are stored but excluded from counts** (missing persons, sudden deaths, found property…) and disclosed as an "excluded" note — they are police reports, not crime.
- **Window anchored at the latest imported day** (`data through <date>`) so a lagging source shrinks the label, never the count silently.
- **Non-CMPD Mecklenburg towns get "coverage not available"** (Huntersville, Cornelius, Davidson, Matthews, Mint Hill, Pineville) instead of misleading low counts.
- **Raw `sql` params**: bind dates as ISO strings with `::timestamptz` and numbers with `::float8`; GROUP BY the CASE expression positionally (`group by 3`) because Postgres cannot match a parameterised expression textually.
- **Transfer lesson**: heredoc bundles must terminate every file with a newline or the next `__NCRR_EOF__` is swallowed (bit us on migration 0001).
