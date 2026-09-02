# DISCOVERY.md — NCWarn / NC Risk Radar Phase 0 (read-only VPS discovery)

> **Status update 2026-09-02 (same day):** after this discovery Dominick chose to destroy the legacy WARN-notice site and rebuild clean. Sections 3 and 8 below describe the state *at discovery time*; the legacy stack (containers, images, volume, DB `ncwarn`, role, `/home/ncwarn/ncwarn-app`) has since been removed (backup in `/home/backups/ncwarn-legacy-2026-09-02/`, git branch/tag `legacy-warn-site`). `ncwarn.conf` now serves a static coming-soon page until cutover. Names chosen for the new stack: `/home/ncwarn/nc-risk-radar`, compose project `ncriskradar`, `127.0.0.1:3020`, DB/role `ncriskradar`, `staging.ncwarn.com` (A record created, DNS-only). See DECISIONS.md and SECURITY.md.

Generated 2026-09-02 (16:21–16:35 UTC) from the Hostinger web console as root. No production changes were made during discovery. Raw (redacted) output: `/root/ncwarn_discovery.txt` on the VPS. No secret values are recorded here; env files are described by variable NAME only.

## 1. Summary
* Multi-tenant Docker host (~25 containers / ~20 sites) behind host Nginx + Let's Encrypt + Cloudflare. Apps are Next.js/Prisma containers built from `/home/<project>` with `docker compose`; PostgreSQL 16 runs on the host (containers use `host.docker.internal`).
* PM2 installed but unused (`pm2-root.service`, zero processes). Convention = Docker Compose `restart: unless-stopped`.
* Hostinger labels the VPS "Coolify" but Coolify is not running (`/data/coolify` is a Sep–Oct 2025 remnant).
* Present: Node 22.19, Docker 29.1.3 + Compose v5, PostgreSQL 16.15 with PostGIS 3.4.2 packages, Redis 7.0.15, Nginx 1.24, certbot 2.9, Postfix→SendGrid relay with DKIM for ncwarn.com, nightly backups.
* Capacity: 4 vCPU AMD EPYC 9354P, 15 GiB RAM (~10 available), 193 GB disk (132 free), no swap, load ~0.4.

## 2. Host facts
Hostinger VPS KVM 4, `srv.cdhosting.com`, 168.231.67.244 / 2a02:4780:2d:e997::1, Ubuntu 24.04.4, kernel 6.8.0-138. Server-level docs `/home/CLAUDE.md` and `/home/vps-inventory.yml` (nightly refresh 03:17; its `agent_rules` are binding: no unrelated restarts, no nginx edits without instruction + `nginx -t`, never print secrets, no deletions without instruction, update inventory after adding a site, `curl -sI` after deploys).

## 3. Legacy NCWarn deployment (as found; since removed)
`/home/ncwarn/ncwarn-app` — Next.js 14 / Prisma WARN-layoff site; compose project `ncwarn-app`; containers `ncwarn` (0.0.0.0:3017→3000), `ncwarn-workers`, `ncwarn-redis`; DB `ncwarn` (33 MB, no PostGIS); env names included PayPal/affiliate/LLM API keys/Cloudflare token; nginx `ncwarn.conf` → 3017 with LE cert for ncwarn.com + www; DKIM key present; `uptime-monitor.sh` auto-restarted it (CRITICAL_CONTAINERS).

## 4. Other applications (do not touch)
Containers (host port→3000): miningclaimsales 3003, thriftykaty 3009, aibuildingtools 3012, minerswarehouse 3002, donateland 3007, realestateagentlisting 3010, veterans-opportunity 3004, axiomservicesllc 3051, msobusiness 3018, 411move 3016, onecallmove 127.0.0.1:3005, gop45nc 3001, roversolar 3008, brokerpayhq 3050, broadband_web 3006, youthfulafter50 3013, spectrummobiledeals 3041, donationmoney 3042. Monitoring in `/opt/monitoring`: grafana 127.0.0.1:3200, prometheus 127.0.0.1:9090, node-exporter 9100, uptime-kuma 127.0.0.1:3100. Host listeners: 22, 25/587, 80/443, 5432 (`listen_addresses='*'`), 631 cupsd, 8891 opendkim, 9100. 22 nginx vhosts. `/root/webhook_receiver.py` (deploy webhook for 3 repos). 17 host databases; per-app `<app>_user` roles. Cron: backups 02:00/03:00, health monitors */5, inventory 03:17, per-site sync jobs.

## 5. Network / DNS / TLS / firewall
ufw active: public 22/80/443; 5432/6379/25 from Docker ranges; 9100 from 10.0.26.0/24. sshd: PermitRootLogin yes, PasswordAuthentication yes; fail2ban 4 jails. certbot per domain (webroot `/var/www/html`). ncwarn.com is Cloudflare-proxied; no cloudflared. `staging.ncwarn.com` was NXDOMAIN (now created). Free ports verified: 3000, 3019, **3020**, 3021+, 4000, 4100, 5000, 5001, 8000, 8080, 8100.

## 6. Data services
PostgreSQL 16.15 host: pg_hba local peer; 127.0.0.1/::1 scram; 10.0.0.0/8 scram; `0.0.0.0/0 scram` (finding). PostGIS 3.4.2 + pgvector installed. Redis host 7.0.15 bound 127.0.0.1 + 10.0.0.1 with password; per-app redis containers are the convention. Postfix relays via SendGrid with OpenDKIM (`/etc/postfix/generic` sender maps); containers may submit to host:25.

## 7. Backups / logs / monitoring
`backup-full.sh` 02:00 (docker volumes, `/etc/nginx`, system configs → `/home/backups/*`, 7-day retention); `backup-postgres.sh` 03:00 `pg_dumpall` → `/home/backups/postgres/` (7 days). Local-disk only; Hostinger snapshots exist at panel level. Logs: nginx (`/var/log/nginx`, daily rotation), journald 161 MB, docker json-file. Grafana/Prometheus/Uptime-Kuma, container + uptime monitors every 5 min, ClamAV.

## 8. Constraints for the new build
Use `ncriskradar` names (done); never edit other vhosts; add the new container to `uptime-monitor.sh` CRITICAL_CONTAINERS and to `vps-inventory.yml`; Cloudflare real-IP config when the record is proxied; no runtime LLM dependency; deploys are manual (`docker compose build && up -d`).

## 9. Security observations
See SECURITY.md §1 — most important: **Docker-published ports bypass ufw** (verified externally on :3009); sshd root+password; Postgres 0.0.0.0/0 hba; host Redis password exposed once in a transcript (rotate); cupsd on 0.0.0.0:631; same-disk backups without tested restore.

## 10. Side effects of discovery
`/root/ncwarn_discovery.{sh,txt}` created (redacted). `pm2 ls` probes touched `~/.pm2` in six user homes (no running processes left).
