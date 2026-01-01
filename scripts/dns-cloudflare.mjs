#!/usr/bin/env node
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env.local') });

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DOMAIN = 'ncwarn.com';

// Get public IP from environment or detect
let PUBLIC_IP = process.env.PUBLIC_IPV4;

async function getPublicIp() {
  if (PUBLIC_IP) return PUBLIC_IP;

  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    try {
      const response = await fetch('https://ifconfig.me/ip');
      return (await response.text()).trim();
    } catch {
      return null;
    }
  }
}

async function getExistingRecord(name) {
  const fqdn = name ? `${name}.${DOMAIN}` : DOMAIN;
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=A&name=${fqdn}`,
    {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  return data.result?.[0] || null;
}

async function upsertRecord(name, ip) {
  const fqdn = name ? `${name}.${DOMAIN}` : DOMAIN;
  const existing = await getExistingRecord(name);

  const body = {
    type: 'A',
    name: fqdn,
    content: ip,
    ttl: 300,
    proxied: true,
  };

  if (existing) {
    // Update existing record
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${existing.id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    if (data.success) {
      console.log(`✓ Updated A record: ${fqdn} -> ${ip}`);
    } else {
      console.error(`✗ Failed to update ${fqdn}:`, data.errors);
    }
  } else {
    // Create new record
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    if (data.success) {
      console.log(`✓ Created A record: ${fqdn} -> ${ip}`);
    } else {
      console.error(`✗ Failed to create ${fqdn}:`, data.errors);
    }
  }
}

async function main() {
  console.log('Cloudflare DNS Update for NCWARN');
  console.log('─────────────────────────────────────');

  if (!ZONE_ID || !API_TOKEN) {
    console.error('Missing Cloudflare credentials in .env.local');
    console.log('\nRequired environment variables:');
    console.log('  CLOUDFLARE_ZONE_ID');
    console.log('  CLOUDFLARE_API_TOKEN');
    console.log('\nOptionally set PUBLIC_IPV4 or it will be auto-detected.');
    process.exit(1);
  }

  const ip = await getPublicIp();
  if (!ip) {
    console.error('Could not determine public IP address.');
    console.log('Set PUBLIC_IPV4 environment variable manually.');
    process.exit(1);
  }

  console.log(`Public IP: ${ip}`);
  console.log(`Domain: ${DOMAIN}`);
  console.log('');

  // Update root domain and www subdomain
  await upsertRecord('', ip);      // ncwarn.com
  await upsertRecord('www', ip);   // www.ncwarn.com

  console.log('\nDNS update complete!');
  console.log('Note: Changes may take a few minutes to propagate.');
}

main().catch((error) => {
  console.error('DNS update failed:', error);
  process.exit(1);
});
