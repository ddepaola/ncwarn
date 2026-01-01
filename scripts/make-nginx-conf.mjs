#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env.local') });

const PORT = process.env.PORT || 3015;
const DOMAIN = 'ncwarn.com';

const conf = `# NCWARN Nginx Configuration
# Generated: ${new Date().toISOString()}
# Port: ${PORT}

# HTTP - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS - main server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    # SSL certificates (uncomment after certbot setup)
    # ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    # ssl_trusted_certificate /etc/letsencrypt/live/${DOMAIN}/chain.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://www.paypalobjects.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https: wss:; frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com; font-src 'self' data:;" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Client body size for file uploads
    client_max_body_size 10m;

    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static file caching
    location /_next/static {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /public {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=86400";
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://127.0.0.1:${PORT};
        access_log off;
    }
}
`;

const outputPath = '/etc/nginx/sites-available/ncwarn.conf';

try {
  fs.writeFileSync(outputPath, conf);
  console.log(`Nginx configuration written to ${outputPath}`);
  console.log(`
Next steps:
1. Create symlink:
   sudo ln -sf ${outputPath} /etc/nginx/sites-enabled/ncwarn.conf

2. Remove default if needed:
   sudo rm /etc/nginx/sites-enabled/default

3. Test configuration:
   sudo nginx -t

4. Reload nginx:
   sudo systemctl reload nginx

5. Setup SSL with certbot:
   sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}
`);
} catch (error) {
  if (error.code === 'EACCES') {
    console.error(`Permission denied. Run with sudo: sudo node ${process.argv[1]}`);
    console.log('\nConfiguration content:\n');
    console.log(conf);
  } else {
    throw error;
  }
}
