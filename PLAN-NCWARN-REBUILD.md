# NCWarn.com Rebuild Plan
## North Carolina WARN Notices & Layoff Intelligence

---

## 1. Executive Summary

Rebuild ncwarn.com as a focused, SEO-optimized platform for **WARN Act layoff notices** in North Carolina. The site will provide:

- **Programmatic SEO pages** for states, counties, companies, and time periods
- **Automated data ingestion** from NC Dept. of Commerce WARN reports
- **Affiliate monetization** via "Next Steps" resource blocks (resume tools, job boards, training)
- **Email capture** for layoff alerts (placeholder for future digest feature)

**Out of scope for Phase 1:** Outages, weather, amber alerts, scams, recalls (existing tables remain but no UI).

**Architecture goal:** National-ready schema (State table, stateCode fields) but NC-only launch.

---

## 2. URL Structure (Routes)

### Core Pages
| Route | Description | Cache |
|-------|-------------|-------|
| `/` | Homepage: latest notices + summary stats | 5 min |
| `/states/north-carolina` | NC landing page | 1 hour |
| `/states/north-carolina/warn` | NC WARN hub (all notices list) | 1 hour |

### Programmatic SEO Pages
| Route | Description | Cache |
|-------|-------------|-------|
| `/states/north-carolina/warn/years/[year]` | Year archive (e.g., 2024) | 1 hour |
| `/states/north-carolina/warn/[year]/[month]` | Month archive (e.g., 2024/12) | 1 hour |
| `/states/north-carolina/warn/counties/[countySlug]` | County page (e.g., wake) | 1 hour |
| `/states/north-carolina/warn/companies/[companySlug]` | Company page | 1 hour |
| `/states/north-carolina/warn/notices/[id]` | Individual notice detail | 24 hours |

### Content Pages
| Route | Description | Cache |
|-------|-------------|-------|
| `/guides/what-is-a-warn-notice` | Educational guide | 7 days |
| `/guides/what-to-do-after-a-layoff-in-nc` | Resource guide | 7 days |
| `/alerts` | Email capture landing page | 1 hour |
| `/about` | About this site + disclaimer | 7 days |
| `/privacy` | Privacy policy | 7 days |
| `/terms` | Terms of use | 7 days |

### API Routes (internal, robots blocked)
| Route | Description |
|-------|-------------|
| `/api/health` | Container healthcheck |
| `/api/sitemap/[segment].xml` | Segmented sitemap generation |
| `/api/admin/import` | Manual import trigger (protected) |

---

## 3. Data Model Changes (Prisma Schema)

### New Tables

```prisma
model State {
  id        Int      @id @default(autoincrement())
  code      String   @unique // 'NC', 'TX', etc.
  name      String   // 'North Carolina'
  slug      String   @unique // 'north-carolina'
  active    Boolean  @default(false) // Only NC active for Phase 1
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  counties County[]
  notices  WarnNotice[]
  imports  ImportRun[]
}

model Company {
  id             Int      @id @default(autoincrement())
  name           String   // Normalized name
  slug           String   @unique
  nameVariations String[] // Array of raw name variations seen
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  notices WarnNotice[]

  @@index([name])
}

model ImportRun {
  id            Int       @id @default(autoincrement())
  stateId       Int
  state         State     @relation(fields: [stateId], references: [id])
  source        String    // 'nc_commerce_csv', 'manual_upload'
  sourceFile    String?   // filename if manual
  startedAt     DateTime  @default(now())
  finishedAt    DateTime?
  status        String    // 'running', 'completed', 'failed'
  itemsFound    Int       @default(0)
  itemsUpserted Int       @default(0)
  itemsSkipped  Int       @default(0)
  errorSummary  String?
  createdAt     DateTime  @default(now())

  @@index([stateId])
  @@index([status])
  @@index([startedAt])
}

model EmailSubscription {
  id          Int       @id @default(autoincrement())
  email       String    @unique
  stateCode   String?   // null = all states
  countyId    Int?      // null = all counties in state
  verified    Boolean   @default(false)
  verifyToken String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([stateCode])
  @@index([verified])
}
```

### Modified Tables

```prisma
model County {
  id        Int      @id @default(autoincrement())
  stateId   Int      // NEW: link to State
  state     State    @relation(fields: [stateId], references: [id])
  fips      String   @unique
  name      String
  slug      String   // unique within state
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  notices WarnNotice[]
  // Keep outages/alerts relations but no UI

  @@unique([stateId, slug])
  @@index([stateId])
}

model WarnNotice {
  id              Int       @id @default(autoincrement())
  stateId         Int       // NEW
  state           State     @relation(fields: [stateId], references: [id])
  countyId        Int?      // nullable for unknown counties
  county          County?   @relation(fields: [countyId], references: [id])
  companyId       Int?      // NEW: link to Company
  company         Company?  @relation(fields: [companyId], references: [id])

  // Raw data (preserved for audit)
  companyNameRaw  String
  countyNameRaw   String?
  addressRaw      String?

  // Parsed/normalized
  city            String?
  zip             String?
  industry        String?
  impacted        Int?
  noticeDate      DateTime
  effectiveDate   DateTime?
  receivedDate    DateTime?
  notes           String?

  // Source tracking
  sourceUrl       String
  sourceDocId     String?   // Unique ID from source if available

  // Deduplication hash
  dedupeHash      String    @unique // composite hash for upsert

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([stateId])
  @@index([countyId])
  @@index([companyId])
  @@index([noticeDate])
  @@index([companyNameRaw])
}
```

### Migration Strategy
1. Add new columns as nullable first
2. Create State record for NC
3. Backfill stateId on existing County/WarnNotice records
4. Create Company records from existing employer names
5. Add NOT NULL constraints where appropriate
6. Create indexes

---

## 4. Import Pipeline Design

### Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Cron Trigger   │────▶│   BullMQ Queue  │────▶│  Worker Process │
│  (6 AM ET)      │     │   "imports"     │     │  importNcWarn   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
        ┌───────────────────────────────────────────────┘
        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Fetch Source   │────▶│  Parse CSV/Data │────▶│  Upsert Records │
│  (URL or file)  │     │  + Normalize    │     │  + Dedup Check  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        └───────────────────────────────────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │  ImportRun Log  │
                        │  (audit trail)  │
                        └─────────────────┘
```

### BullMQ Jobs

**Queue: `imports`**

| Job Name | Schedule | Description |
|----------|----------|-------------|
| `importNcWarn` | Daily 6:00 AM ET | Fetch NC WARN data, parse, upsert |
| `importNcWarnManual` | On-demand | Same as above, triggered via script |

### Dedupe Rules

**Composite Key Hash:**
```
hash = SHA256(
  stateCode + '|' +
  normalizeCompanyName(companyName) + '|' +
  normalizeCounty(county) + '|' +
  noticeDate.toISOString().slice(0,10) + '|' +
  (impacted || '0')
)
```

**Normalization functions:**
- `normalizeCompanyName`: lowercase, remove Inc/LLC/Corp, trim, collapse spaces
- `normalizeCounty`: lowercase, remove "county", trim

### Data Source Strategy

**Primary: NC Commerce CSV**
- URL: https://www.commerce.nc.gov/data/warn-notices (or linked CSV)
- Fallback: Manual CSV upload to `/data/nc-warn-manual.csv`

**Manual Upload Workflow:**
1. Download CSV from NC Commerce
2. Place in `/data/nc-warn-manual.csv`
3. Run: `npm run import:nc:manual`

### Error Handling
- Retry failed jobs up to 3 times with exponential backoff
- Log all errors to ImportRun.errorSummary
- Continue processing valid rows even if some fail
- Alert on complete job failure (future: email/Slack)

---

## 5. Page Templates & SEO Strategy

### Page Types & Templates

| Page Type | Title Pattern | Meta Description |
|-----------|---------------|------------------|
| Homepage | "NC WARN Notices & Layoff Intelligence" | "Track WARN Act layoff notices..." |
| State Hub | "[State] WARN Act Layoff Notices - [Year]" | "View all WARN notices filed in [State]..." |
| Year Archive | "[State] WARN Notices [Year] - [Count] Layoffs" | "[Count] WARN notices filed in [State] during [Year]..." |
| Month Archive | "[State] WARN Notices [Month] [Year]" | "WARN Act layoff notices for [Month] [Year] in [State]..." |
| County Page | "[County] County, [State] WARN Notices" | "Track layoffs in [County] County..." |
| Company Page | "[Company] WARN Notices - Layoff History" | "View WARN notices filed by [Company]..." |
| Notice Detail | "[Company] Layoff Notice - [County], [State] ([Date])" | "[Company] filed a WARN notice affecting [N] workers..." |
| Guide | "[Title] - NCWarn.com" | Custom per guide |

### JSON-LD Schema

**List Pages (CollectionPage):**
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Wake County WARN Notices",
  "description": "...",
  "mainEntity": {
    "@type": "ItemList",
    "numberOfItems": 47,
    "itemListElement": [...]
  }
}
```

**Notice Detail (Article/NewsArticle):**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "ABC Corp files WARN notice",
  "datePublished": "2024-12-15",
  "publisher": {...}
}
```

### Internal Linking Strategy

Each page includes:
1. **Breadcrumbs**: Home > NC > WARN > County > Notice
2. **Related Links**: Other notices in same county, same company
3. **Time Navigation**: Previous/Next month, link to year
4. **Cross-links**: From company page to all counties affected

### Sitemap Strategy

**Index Sitemap:** `/sitemap.xml`
```xml
<sitemapindex>
  <sitemap><loc>/api/sitemap/static.xml</loc></sitemap>
  <sitemap><loc>/api/sitemap/notices-2024.xml</loc></sitemap>
  <sitemap><loc>/api/sitemap/notices-2023.xml</loc></sitemap>
  <sitemap><loc>/api/sitemap/counties.xml</loc></sitemap>
  <sitemap><loc>/api/sitemap/companies.xml</loc></sitemap>
</sitemapindex>
```

**Segmented by year** to keep each under 50k URLs.

---

## 6. Caching Strategy

### Next.js Page Caching

| Page Type | `revalidate` | `Cache-Control` Header |
|-----------|--------------|------------------------|
| Homepage | 300 (5 min) | `public, s-maxage=300, stale-while-revalidate=600` |
| List pages | 3600 (1 hr) | `public, s-maxage=3600, stale-while-revalidate=7200` |
| Detail pages | 86400 (24 hr) | `public, s-maxage=86400, stale-while-revalidate=172800` |
| Guides | 604800 (7 days) | `public, s-maxage=604800, stale-while-revalidate=604800` |
| Sitemap | 3600 | `public, s-maxage=3600` |

### Cloudflare Compatibility

- Use `s-maxage` for edge caching (Cloudflare respects this)
- Use `stale-while-revalidate` for instant responses during revalidation
- Static assets (`/_next/static`): immutable, 1 year cache

### Cache Invalidation

- After successful import: no manual purge needed (revalidate handles it)
- Emergency purge: Cloudflare API call (manual, document in ops runbook)

---

## 7. Docker/Ops Changes

### docker-compose.yml (Updated)

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: ncwarn-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - ncwarn-redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ncwarn
    restart: unless-stopped
    ports:
      - "3017:3000"  # Changed from 3015
    env_file:
      - .env.ncwarn
    environment:
      - NODE_ENV=production
      - HOSTNAME=0.0.0.0
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      start_period: 40s
      retries: 3

  workers:
    build:
      context: .
      dockerfile: Dockerfile.workers
    container_name: ncwarn-workers
    restart: unless-stopped
    env_file:
      - .env.ncwarn
    environment:
      - NODE_ENV=production
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "ps aux | grep -v grep | grep -q node || exit 1"]
      interval: 60s
      timeout: 10s
      start_period: 30s
      retries: 3

volumes:
  ncwarn-redis-data:
```

### Required Environment Variables (.env.ncwarn)

```bash
# Database
DATABASE_URL=postgresql://ncwarn:ncwarn@host.docker.internal:5432/ncwarn

# Redis (internal to docker network)
REDIS_URL=redis://redis:6379

# Site
NEXT_PUBLIC_SITE_URL=https://ncwarn.com
NEXT_PUBLIC_SITE_NAME="NCWarn.com"

# Affiliate (optional, placeholders)
AFFILIATE_INDEED_URL=https://indeed.com
AFFILIATE_LINKEDIN_URL=https://linkedin.com
AFFILIATE_RESUME_TOOL_URL=https://resume.io

# Import schedule (cron format for BullMQ)
IMPORT_CRON="0 6 * * *"  # 6 AM daily

# Optional: Slack webhook for alerts
# SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### Nginx Update (already done in previous session)
- Proxy to port 3017
- Config at `/etc/nginx/sites-available/ncwarn.conf`

---

## 8. Milestones

### Phase 0: Restore Runtime (DONE)
- [x] Fix Redis config (redis://redis:6379)
- [x] Add Redis service to docker-compose
- [x] Move web to port 3017
- [x] Update nginx proxy
- [x] Verify healthchecks pass

### Phase 1: Launch (This Implementation)
- [ ] Prisma schema migration (State, Company, ImportRun, updated WarnNotice)
- [ ] Seed NC state + counties with stateId
- [ ] BullMQ import job with dedupe
- [ ] New route structure (/states/north-carolina/warn/...)
- [ ] Programmatic SEO pages (year, month, county, company, detail)
- [ ] Affiliate "Next Steps" component
- [ ] Disclaimer footer component
- [ ] Sitemap generation
- [ ] Remove outages/weather/etc from main nav/homepage
- [ ] Cache headers per page type
- [ ] Guides (2 static pages)
- [ ] Email capture page (form only, no backend yet)

### Phase 1.1: Email Digest (Future)
- [ ] EmailSubscription verification flow
- [ ] Weekly digest job
- [ ] Unsubscribe handling

### Phase 2: Multi-State (Future)
- [ ] Add State records for other states (TX, CA, etc.)
- [ ] State-specific importers
- [ ] State selector in UI
- [ ] Update sitemap to include all states

---

## 9. Risk List & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| NC Commerce changes CSV format | Import breaks | Flexible field mapping, version-tolerant parsing, alert on parse errors |
| NC Commerce removes public CSV | Data source lost | Manual CSV upload fallback, document download process |
| Duplicate notices after schema change | Data integrity | Dedupe hash on all existing + new records, migration script |
| Affiliate links violate policies | Account suspension | Clear disclosure, no deceptive language, review ToS |
| High traffic after SEO indexing | Server overload | Cloudflare caching, rate limiting on API |
| Prisma migration breaks production | Downtime | Test migration on staging, backup before deploy |
| BullMQ job fails silently | Stale data | ImportRun logging, health dashboard, alert on failure |
| Cloudflare serves stale cache too long | Outdated content | Set appropriate s-maxage, SWR headers |

---

## 10. Questions for Approval

**Q1: Data Source Confirmation**

The NC Commerce WARN page is at https://www.commerce.nc.gov/data/warn-notices. I will implement:
- Primary: Attempt CSV fetch from the page
- Fallback: Manual CSV upload to `/data/nc-warn-manual.csv`

Is this acceptable, or do you have a specific CSV URL or prefer PDF parsing?

**Q2: Affiliate Links**

For the "Next Steps" module, I'll use placeholder URLs that you can configure via environment variables:
- Resume builder (e.g., Resume.io, Zety)
- Job boards (e.g., Indeed, LinkedIn)
- Unemployment resources (NC DES link)
- Training/upskilling (e.g., Coursera, LinkedIn Learning)

Should I include specific affiliate program URLs, or keep them as configurable placeholders?

**Q3: Email Capture Backend**

For `/alerts`, should I:
- (A) Build full email verification + storage now (adds complexity)
- (B) Just create the form UI with a "coming soon" message
- (C) Integrate with a 3rd party (Mailchimp, ConvertKit) via API

---

## File Tree Changes Summary

```
/home/ncwarn/ncwarn-app/
├── prisma/
│   ├── schema.prisma           # Updated with State, Company, ImportRun
│   └── migrations/             # New migration files
├── app/
│   ├── page.tsx                # Simplified homepage (WARN focus)
│   ├── layout.tsx              # Updated nav (remove outages/weather)
│   ├── states/
│   │   └── north-carolina/
│   │       ├── page.tsx        # NC landing
│   │       └── warn/
│   │           ├── page.tsx    # Hub list
│   │           ├── years/
│   │           │   └── [year]/page.tsx
│   │           ├── [year]/
│   │           │   └── [month]/page.tsx
│   │           ├── counties/
│   │           │   └── [countySlug]/page.tsx
│   │           ├── companies/
│   │           │   └── [companySlug]/page.tsx
│   │           └── notices/
│   │               └── [id]/page.tsx
│   ├── guides/
│   │   ├── what-is-a-warn-notice/page.tsx
│   │   └── what-to-do-after-a-layoff-in-nc/page.tsx
│   ├── alerts/
│   │   └── page.tsx            # Email capture
│   └── api/
│       ├── sitemap/
│       │   └── [segment]/route.ts
│       └── admin/
│           └── import/route.ts  # Manual import trigger
├── components/
│   ├── NextSteps.tsx           # Affiliate block
│   ├── Disclaimer.tsx          # Legal disclaimer
│   ├── Breadcrumbs.tsx         # SEO breadcrumbs
│   └── NoticeCard.tsx          # Notice display component
├── jobs/
│   ├── queue.ts                # BullMQ setup
│   └── workers/
│       └── importNcWarn.ts     # Import job
├── lib/
│   ├── importers/
│   │   └── nc-warn.ts          # NC-specific import logic
│   ├── normalize.ts            # Name normalization functions
│   └── dedupe.ts               # Deduplication hash
├── scripts/
│   ├── import-nc-warn.ts       # CLI for manual import
│   └── seed-states.ts          # Seed State + update counties
├── docker-compose.yml          # Updated
├── .env.ncwarn.example         # Documented env vars
└── PLAN-NCWARN-REBUILD.md      # This file
```

---

## Approval Requested

Please review this plan and answer Q1-Q3 above. Once approved, I will implement Phase 1 in order:

1. Prisma schema migration
2. Seed scripts (states, update counties)
3. Import pipeline (BullMQ job)
4. Route structure + page templates
5. Components (NextSteps, Disclaimer, etc.)
6. SEO (meta, JSON-LD, sitemap)
7. Docker/ops verification
8. Test run + verification

Ready to proceed on your approval.
