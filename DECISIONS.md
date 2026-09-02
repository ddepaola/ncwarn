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
