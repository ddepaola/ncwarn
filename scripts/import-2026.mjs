/**
 * One-time script to import 2026 WARN notices from CSV
 * Run with: node scripts/import-2026.mjs
 */
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeCompanyName(name) {
  return name.toLowerCase().trim()
    .replace(/\b(inc\.?|incorporated|llc|llp|l\.l\.c\.?|corp\.?|corporation|co\.?|company|ltd\.?|limited|plc|pllc|lp|l\.p\.)\b/gi, '')
    .replace(/\s*d\/?b\/?a\s*.*/i, '')
    .replace(/[.,'"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifyCompany(name) {
  return normalizeCompanyName(name)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeCounty(name) {
  return name.toLowerCase().trim()
    .replace(/\s+county$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifyCounty(name) {
  return normalizeCounty(name)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateDedupeHash({ stateCode, companyName, county, noticeDate, impacted }) {
  const parts = [
    stateCode.toUpperCase(),
    normalizeCompanyName(companyName),
    county ? normalizeCounty(county) : '',
    noticeDate.toISOString().slice(0, 10),
    String(impacted || 0),
  ];
  return createHash('sha256').update(parts.join('|')).digest('hex');
}

function parseDate(str) {
  if (!str) return null;
  const m = str.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]));
  return new Date(str);
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += line[i];
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  const csv = readFileSync('/home/ncwarn/ncwarn-app/data/nc-warn-2026.csv', 'utf-8');
  const lines = csv.trim().split('\n');
  const headers = parseCsvLine(lines[0]);

  const state = await prisma.state.findUnique({ where: { code: 'NC' } });
  if (!state) { console.error('NC state not found'); process.exit(1); }

  let upserted = 0, skipped = 0, errors = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = fields[idx]; });

    const companyNameRaw = row['Company Name'];
    const countyNameRaw = row['County'];
    const noticeDate = parseDate(row['Notice Date']);
    const effectiveDate = parseDate(row['Effective Date']);
    const impacted = parseInt(row['Employees Affected']) || null;

    if (!companyNameRaw || !noticeDate) { errors++; continue; }

    const normalized = normalizeCompanyName(companyNameRaw);
    const dedupeHash = generateDedupeHash({
      stateCode: 'NC',
      companyName: companyNameRaw,
      county: countyNameRaw,
      noticeDate,
      impacted,
    });

    // Check existing
    const existing = await prisma.warnNotice.findUnique({ where: { dedupeHash } });
    if (existing) { skipped++; continue; }

    // Get or create company
    const companySlug = slugifyCompany(companyNameRaw);
    let company = await prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) {
      company = await prisma.company.create({
        data: { name: normalized, slug: companySlug, nameVariations: [companyNameRaw] },
      });
    } else if (!company.nameVariations.includes(companyNameRaw)) {
      await prisma.company.update({
        where: { id: company.id },
        data: { nameVariations: { push: companyNameRaw } },
      });
    }

    // Find county
    let countyId = null;
    if (countyNameRaw && countyNameRaw !== 'N/A') {
      const countySlug = slugifyCounty(countyNameRaw);
      const county = await prisma.county.findFirst({
        where: { stateId: state.id, slug: countySlug },
      });
      if (county) countyId = county.id;
    }

    await prisma.warnNotice.create({
      data: {
        stateId: state.id,
        countyId,
        companyId: company.id,
        employer: companyNameRaw,
        companyNameRaw,
        countyNameRaw: countyNameRaw || null,
        city: row['City'] || null,
        industry: row['Industry'] || null,
        impacted,
        noticeDate,
        effectiveOn: effectiveDate,
        notes: row['Notes'] || null,
        sourceUrl: 'https://www.commerce.nc.gov/data-tools-reports/labor-market-data-tools/workforce-warn-reports/report-workforce-warn-listings-2026',
        dedupeHash,
      },
    });
    upserted++;
    console.log(`  + ${companyNameRaw} (${countyNameRaw}, ${impacted} workers)`);
  }

  console.log(`\nDone: ${upserted} added, ${skipped} skipped, ${errors} errors`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
