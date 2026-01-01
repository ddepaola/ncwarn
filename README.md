# NCWARN - North Carolina Warnings, Alerts & WARN Notices

A comprehensive platform for tracking layoffs, weather alerts, power outages, recalls, AMBER alerts, and scam warnings across North Carolina.

## Features

- **WARN Act Tracker**: Layoff and plant closing notices by county/company
- **Weather Alerts**: Real-time NWS warnings for all NC counties
- **Power Outages**: Current outage data from Duke, Dominion, EMCs
- **AMBER Alerts**: Child abduction alerts
- **Scam Alerts**: Consumer protection warnings from NC DOJ
- **Recalls**: Vehicle/product/food recalls (NHTSA, CPSC, FDA)
- **Job Board**: PayPal-powered job listings

## Tech Stack

- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache/Queue**: Redis + BullMQ
- **Process Manager**: PM2
- **Web Server**: Nginx reverse proxy

## Quick Start

```bash
# 1. Choose port and create .env.local
node scripts/choose-port.mjs
cat .env.local

# SECURITY: Rotate any previously shared keys
chmod 600 .env.local

# 2. Install dependencies & setup database
npm ci
npm run db:push
npm run db:generate
npm run seed:counties
npm run seed:demo

# 3. Build
npm run build

# 4. Start with PM2
pm2 start ecosystem.config.cjs --only ncwarn --update-env
pm2 save
pm2 status ncwarn

# 5. Setup Nginx
sudo npm run nginx:make
sudo ln -sf /etc/nginx/sites-available/ncwarn.conf /etc/nginx/sites-enabled/ncwarn.conf
sudo nginx -t && sudo systemctl reload nginx

# 6. SSL Certificate
sudo certbot --nginx -d ncwarn.com -d www.ncwarn.com

# 7. (Optional) Update Cloudflare DNS
export PUBLIC_IPV4=$(curl -s https://api.ipify.org)
npm run dns:update

# 8. Run data ingests
npm run ingest:all
```

## Development

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run test       # Run tests
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with auto port selection |
| `npm run build` | Build for production |
| `npm run db:push` | Push Prisma schema to database |
| `npm run seed:counties` | Seed NC counties |
| `npm run seed:demo` | Seed demo data |
| `npm run ingest:all` | Run all data ingestion jobs |
| `npm run nginx:make` | Generate Nginx config |
| `npm run dns:update` | Update Cloudflare DNS |
| `npm run pm2:help` | Show PM2 command reference |

## PM2 Commands

```bash
# Start/restart
pm2 start ecosystem.config.cjs --only ncwarn --update-env
pm2 restart ncwarn --update-env

# Monitor
pm2 status ncwarn
pm2 logs ncwarn
pm2 monit

# Persistence
pm2 save
pm2 startup
```

## Environment Variables

See `.env.example` for all available configuration options.

Required:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

Optional:
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`: For job board payments
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.: For AI features
- `CLOUDFLARE_*`: For DNS management

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/warn` | WARN Act notices (filterable) |
| `GET /api/alerts` | Weather alerts |
| `GET /api/outages` | Power outages |
| `GET /api/scams` | Scam alerts |
| `GET /api/recalls` | Product recalls |
| `GET /api/jobs` | Job listings |
| `POST /api/jobs` | Create job + PayPal order |
| `POST /api/jobs/capture` | Capture PayPal payment |
| `GET /api/health` | Health check |

## Data Sources

- **WARN Notices**: NC Commerce
- **Weather**: National Weather Service API
- **Outages**: Duke Energy, Dominion Energy
- **AMBER Alerts**: NCMEC, NC DOJ
- **Scams**: NC Department of Justice
- **Recalls**: NHTSA, CPSC, FDA

## Security

- Rate limiting via Redis
- Zod input validation
- CSP headers via Nginx
- Secrets in `.env.local` only (chmod 600)

## License

Proprietary. All rights reserved.

---

Built for North Carolina residents.
