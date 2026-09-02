# SECURITY.md

## 1. Host findings (2026-09-02) — need Dominick's decision
1. **Docker-published ports bypass ufw.** Verified externally: `168.231.67.244:3009` answers from the internet while 5432/6379 are filtered. Docker inserts its NAT/FORWARD rules ahead of ufw and `DOCKER-USER` is empty, so every container published on `0.0.0.0:30xx` is reachable without TLS/Cloudflare. **Fix options (pick one):**
   - (a) *Recommended, least disruptive:* add DOCKER-USER rules that only allow published ports from localhost/Docker networks, persisted in `/etc/ufw/after.rules`:
     ```
     *filter
     :DOCKER-USER - [0:0]
     -A DOCKER-USER -i eth0 -p tcp -m conntrack --ctorigdstport 3000:3999 --ctdir ORIGINAL -j DROP
     -A DOCKER-USER -j RETURN
     COMMIT
     ```
     then `ufw reload` (nginx still reaches 127.0.0.1:30xx; only inbound on eth0 is dropped). Verify: `curl -m5 http://168.231.67.244:3009` from outside must time out.
   - (b) Change each app's compose `ports:` to `127.0.0.1:30xx:3000` (requires restarting ~18 containers).
   This app already binds `127.0.0.1:3020` and is unaffected.
2. **sshd:** `PermitRootLogin yes`, `PasswordAuthentication yes`. Recommend key-only + `prohibit-password` (Hostinger console remains as break-glass).
3. **PostgreSQL** `listen_addresses='*'` with `host all all 0.0.0.0/0 scram` — only ufw protects 5432. Recommend `listen_addresses='localhost,10.0.0.1'`-style narrowing + pg_hba limited to Docker ranges (needs a PG restart window).
4. **Redis host password** appeared once in a discovery transcript — rotate `requirepass` (check `vps-inventory.yml` consumers first).
5. **cupsd** listening on 0.0.0.0:631 (snap cups) — remove.
6. Backups are same-disk only; no tested restore yet (required before launch).

## 2. Application controls (implemented)
- Env validated at boot (`src/lib/env.ts`); secrets never logged (pino redaction).
- Security headers + strict CSP (`next.config.ts`); no third-party scripts/fonts.
- Web container non-root, bound to 127.0.0.1:3020; Redis internal-only.
- Rate limits (Redis, per salted /24 class): address resolve 30/10 min, signup 5/10 min, contact 3/15 min.
- Public forms: honeypot + signed timing token; bots receive a neutral 200; attempts counted in `bot_traps` (no bodies stored).
- Admin routes: server-side enforcement in `src/proxy.ts` (HTTP Basic, constant-time compare) + `X-Robots-Tag: noindex`; Auth.js + roles in Milestone 3.
- Opaque public IDs; no sequential ids exposed.
- IP addresses are stored only as a salted, truncated class (`ipClass`).
- Least-privilege DB role `ncriskradar` (owner of its DB only).

## 3. Credential rotation
`.env` on the server holds `DATABASE_URL`, `ADMIN_TOKEN`, SMTP creds. Rotate: change the value, `docker compose up -d` (web+worker restart). DB password: `ALTER ROLE ncriskradar PASSWORD '…'` then update `.env`. Never paste secrets into chat, git, or logs.

## 4. Incident notes
- Suspected abuse of forms: check `/admin/sources` bot-trap counters and `docker logs ncriskradar-web | grep "bot trap"`.
- Compromise of `ADMIN_TOKEN`: rotate immediately (it also salts ipClass and signs form tokens — rotation invalidates outstanding form tokens for up to 6h; harmless).
