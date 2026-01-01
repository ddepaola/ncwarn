#!/usr/bin/env node
import net from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const CANDIDATES = [3005, 3013, 3014, 3015, 3016, 3017, 3018, 3019, 3020, 3021];
const FALLBACK = 3015;

function checkPort(port) {
  return new Promise((resolve) => {
    const srv = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => srv.close(() => resolve(true)))
      .listen(port, '127.0.0.1');
  });
}

async function main() {
  console.log('[choose-port] Checking available ports...');

  let chosen = null;
  for (const p of CANDIDATES) {
    const available = await checkPort(p);
    if (available) {
      chosen = p;
      break;
    }
    console.log(`[choose-port] Port ${p} is in use`);
  }

  if (!chosen) {
    console.log(`[choose-port] No ports available, using fallback ${FALLBACK}`);
    chosen = FALLBACK;
  }

  const envPath = path.join(rootDir, '.env.local');
  let env = '';

  if (fs.existsSync(envPath)) {
    env = fs.readFileSync(envPath, 'utf8');
    // Remove existing PORT line
    env = env.replace(/^PORT=\d+\n?/m, '');
  }

  // Add PORT at the beginning
  env = `PORT=${chosen}\n${env}`;
  fs.writeFileSync(envPath, env);

  console.log(`[choose-port] Using PORT=${chosen} (saved to .env.local)`);

  // Print security warning on first run
  if (!fs.existsSync(path.join(rootDir, 'node_modules'))) {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                       SECURITY WARNING                             ║
╠════════════════════════════════════════════════════════════════════╣
║  If any credentials were previously shared in plain text:          ║
║                                                                    ║
║  1. ROTATE ALL AFFECTED API KEYS AND PASSWORDS IMMEDIATELY         ║
║  2. Run: chmod 600 .env.local                                      ║
║  3. Consider using a secrets manager for production                ║
║  4. Never commit .env.local to version control                     ║
╚════════════════════════════════════════════════════════════════════╝
`);
  }

  // Export for shell use
  process.env.PORT = String(chosen);
}

main().catch(console.error);
