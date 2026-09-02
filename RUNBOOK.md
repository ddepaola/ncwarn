# RUNBOOK.md — NC Risk Radar operations

## Where things are (VPS `srv`, 168.231.67.244)
- App dir: `/home/ncwarn/nc-risk-radar` (git `ddepaola/ncwarn`, branch `main`)
- Compose project `ncriskradar`: containers `ncriskradar-web` (127.0.0.1:3020→3000), `ncriskradar-worker`, `ncriskradar-redis`, one-shot `ncriskradar-migrate`
- DB: host PostgreSQL 16, database `ncriskradar`, role `ncriskradar` (PostGIS enabled)
- Nginx: `/etc/nginx/sites-available/staging.ncwarn.com.conf` (staging); `ncwarn.conf` (production, coming-soon page until cutover)
- Env: `/home/ncwarn/nc-risk-radar/.env` (root-only). Template: `.env.example`
- Logs: `docker logs -f ncriskradar-web|ncriskradar-worker` (json-file, 10m×3 rotation); nginx `/var/log/nginx/`

## Deploy
```bash
cd /home/ncwarn/nc-risk-radar && git pull && ./deploy/deploy.sh          # add --no-cache for static page changes
curl -sI https://staging.ncwarn.com | head -1
```
The `migrate` service runs migrations + idempotent seed before web/worker start.

## Rollback
```bash
git checkout <previous-sha> && ./deploy/deploy.sh   # images are rebuilt from the checked-out tree
```
Migrations are forward-only; write a new migration to undo schema changes.

## Database
- New migration: edit `src/lib/db/schema.ts` → `npm run db:generate` → review SQL in `drizzle/` (unquote `geography(Point,4326)` if drizzle-kit quotes it) → deploy.
- Manual psql: `sudo -u postgres psql -d ncriskradar`
- Nightly `pg_dumpall` (03:00) already covers this DB (`/home/backups/postgres/`). **Test restore** (pre-launch): `createdb ncrr_restore && gunzip -c pg_dumpall_X.sql.gz | psql ...`.

## Host integration (done at setup)
- `uptime-monitor.sh` CRITICAL_CONTAINERS: `["ncriskradar-web"]="/home/ncwarn/nc-risk-radar"`
- `/home/vps-inventory.yml` refreshes nightly; note the new site there.

## Cutover to ncwarn.com (Milestone 5, needs approval)
1. Freeze; back up `/etc/nginx/sites-available/ncwarn.conf`.
2. Set `APP_URL=https://ncwarn.com` in `.env`, redeploy.
3. Replace the static `location /` in `ncwarn.conf` with the proxy block from `deploy/staging.ncwarn.com.conf` (upstream 127.0.0.1:3020); `nginx -t && systemctl reload nginx`.
4. Verify TLS, redirects, robots, health, forms, logs. Rollback = restore the backed-up conf + reload.

## Source imports (CMPD)
- Scheduled: worker job scheduler `cmpd-every-6h` (BullMQ, prefix `ncrr`). Incremental runs re-scan from the last imported day minus 7 days; idempotent upsert on (source, external id) with content-hash change detection.
- Manual: `/admin/sources` → "Run import now" (optional since-date), or `curl -u admin:$ADMIN_TOKEN -X POST -H 'content-type: application/json' -d '{"since":"2026-01-01"}' http://127.0.0.1:3020/api/admin/sources/cmpd_incidents/run`.
- Watch: `docker compose logs -f worker | grep -E 'cmpd|source run'`; run rows in `source_runs`; freshness in `coverage_status`.
- First backfill (760 days ≈ 190k rows) takes ~2–3 minutes against the ArcGIS service; a failed run marks coverage `temporarily_unavailable` only if there has been no success in 3 days.
- Re-backfill from scratch: `truncate crime_incidents; delete from raw_records where source_id=(select id from sources where key='cmpd_incidents');` then a manual run.

## Health
`GET /api/health` → `{status: ok|degraded, checks:{postgres, redis}}`. Worker heartbeat every 5 min, freshness recompute every 15 min.
