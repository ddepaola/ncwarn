# NC Risk Radar (NCWarn.com)

Know What's Nearby. Know What's Coming. — property, safety, development, and government alerts for North Carolina.

Standalone Next.js 16 (App Router, TypeScript, Tailwind) + PostgreSQL 16/PostGIS + Redis/BullMQ, deployed as a Docker Compose stack behind host Nginx. See `NCWarn_Claude_Developer_Handoff.docx` for the product specification and the docs listed below.

| Doc | Purpose |
|---|---|
| `DISCOVERY.md` | Phase 0 VPS discovery |
| `PLAN.md` | Milestones, dependencies, risks, acceptance tests, decisions needed |
| `DECISIONS.md` | Architecture decision log |
| `DATA_SOURCES.md` | Source profiles and terms/reuse decisions |
| `SECURITY.md` | Controls, findings, credential rotation |
| `RUNBOOK.md` | Deploy, rollback, backups, incident notes |
| `CHANGELOG.md` | Milestone history |

## Local development
```bash
cp .env.example .env            # fill DATABASE_URL (PostGIS-enabled db) and REDIS_URL
npm ci
npm run db:migrate && npm run db:seed
npm run dev                     # web on :3000
npm run worker                  # BullMQ worker
npm test && npm run typecheck && npm run lint
```

## Layout
`src/app` routes · `src/components` UI · `src/modules/*` business rules (address, coverage, crime, registry, sources, notifications) · `src/lib` db/redis/env/logging · `worker/` queue processors · `scripts/` migrate/seed · `drizzle/` SQL migrations · `deploy/` nginx + deploy script.
