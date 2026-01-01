#!/usr/bin/env node
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env.local') });

const PORT = process.env.PORT || 3015;
const APP_NAME = 'ncwarn';

console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                     NCWARN PM2 Commands                            ║
╠════════════════════════════════════════════════════════════════════╣
║  Application: ${APP_NAME.padEnd(50)}║
║  Port: ${String(PORT).padEnd(56)}║
╚════════════════════════════════════════════════════════════════════╝

📦 DEPLOYMENT COMMANDS
─────────────────────────────────────────────────────────────────────
# Start the application
pm2 start ecosystem.config.cjs --only ${APP_NAME} --update-env

# Restart with env reload
pm2 restart ${APP_NAME} --update-env

# Stop the application
pm2 stop ${APP_NAME}

# Delete from PM2
pm2 delete ${APP_NAME}

📊 MONITORING COMMANDS
─────────────────────────────────────────────────────────────────────
# View status
pm2 status ${APP_NAME}

# View logs (real-time)
pm2 logs ${APP_NAME}

# View logs (last 100 lines)
pm2 logs ${APP_NAME} --lines 100

# Monitor resources
pm2 monit

# Describe process
pm2 describe ${APP_NAME}

🔧 MAINTENANCE COMMANDS
─────────────────────────────────────────────────────────────────────
# Save current process list (for startup)
pm2 save

# Setup startup script (run once)
pm2 startup

# Reload with zero downtime
pm2 reload ${APP_NAME}

# Flush logs
pm2 flush ${APP_NAME}

📝 LOG LOCATIONS
─────────────────────────────────────────────────────────────────────
Error logs: /var/log/pm2/${APP_NAME}.err.log
Output logs: /var/log/pm2/${APP_NAME}.out.log

⚡ QUICK START
─────────────────────────────────────────────────────────────────────
# Full deployment sequence:
npm run build && pm2 start ecosystem.config.cjs --only ${APP_NAME} --update-env && pm2 save

# Check health:
curl http://localhost:${PORT}/api/health
`);
