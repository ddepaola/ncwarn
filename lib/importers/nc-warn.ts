/**
 * NC WARN Notice Importer
 *
 * Fetches WARN notices from NC Department of Commerce and upserts into database.
 * Supports both URL fetch and manual file upload fallback.
 */

import { PrismaClient } from '@prisma/client';
import Papa from 'papaparse';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../logger';
import { generateDedupeHash } from '../dedupe';
import { normalizeCompanyName, slugifyCompany, normalizeCounty, slugifyCounty } from '../normalize';

const logger = createLogger('importer:nc-warn');

// NC Commerce WARN data source
const NC_WARN_SOURCE_URL = 'https://www.commerce.nc.gov/data/warn-notices';
const MANUAL_CSV_PATH = '/app/data/nc-warn-manual.csv';
const STATE_CODE = 'NC';

export interface ImportResult {
  success: boolean;
  itemsFound: number;
  itemsUpserted: number;
  itemsSkipped: number;
  errors: string[];
  duration: number;
}

interface RawWarnRow {
  // Flexible field mapping - source may use different column names
  'Company Name'?: string;
  'Company'?: string;
  'Employer'?: string;
  'Employer Name'?: string;
  'City'?: string;
  'County'?: string;
  'Industry'?: string;
  'NAICS'?: string;
  'Employees Affected'?: string;
  'Number Affected'?: string;
  'Impacted'?: string;
  'Number of Employees'?: string;
  '# Employees'?: string;
  'Notice Date'?: string;
  'Received Date'?: string;
  'Date Received'?: string;
  'Effective Date'?: string;
  'Layoff Date'?: string;
  'Notes'?: string;
  'Comments'?: string;
  'Address'?: string;
  'Zip'?: string;
  'ZIP'?: string;
  [key: string]: string | undefined; // Allow other columns
}

interface ParsedNotice {
  companyName: string;
  companyNameRaw: string;
  city: string | null;
  countyName: string;
  countyNameRaw: string;
  industry: string | null;
  impacted: number | null;
  noticeDate: Date;
  effectiveDate: Date | null;
  receivedDate: Date | null;
  notes: string | null;
  addressRaw: string | null;
  zip: string | null;
}

/**
 * Parse a date string in various formats
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;

  // Try various date formats
  const formats = [
    // ISO format
    /^\d{4}-\d{2}-\d{2}/,
    // US format MM/DD/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/,
    // US format MM-DD-YYYY
    /^\d{1,2}-\d{1,2}-\d{2,4}/,
  ];

  const cleaned = dateStr.trim();

  // Handle MM/DD/YYYY format explicitly
  const usMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (usMatch) {
    const month = parseInt(usMatch[1], 10);
    const day = parseInt(usMatch[2], 10);
    let year = parseInt(usMatch[3], 10);
    if (year < 100) year += 2000;
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) return date;
  }

  // Default parsing
  const parsed = new Date(cleaned);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parse a number from string, handling various formats
 */
function parseNumber(numStr: string | undefined): number | null {
  if (!numStr) return null;
  const cleaned = numStr.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

/**
 * Extract field value with fallback column names
 */
function getField(row: RawWarnRow, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (row[key] && row[key]!.trim()) {
      return row[key]!.trim();
    }
  }
  return undefined;
}

/**
 * Parse CSV text into normalized notice records
 */
function parseCsv(csvText: string): ParsedNotice[] {
  const records: ParsedNotice[] = [];

  const result = Papa.parse<RawWarnRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    logger.warn({ errors: result.errors.slice(0, 5) }, 'CSV parse warnings');
  }

  for (const row of result.data) {
    try {
      // Get company name (required)
      const companyNameRaw = getField(row, 'Company Name', 'Company', 'Employer', 'Employer Name');
      if (!companyNameRaw) continue;

      // Get county (required)
      const countyNameRaw = getField(row, 'County');
      if (!countyNameRaw) continue;

      // Get notice date (required)
      const noticeDateStr = getField(row, 'Notice Date', 'Received Date', 'Date Received');
      const noticeDate = parseDate(noticeDateStr);
      if (!noticeDate) continue;

      records.push({
        companyName: normalizeCompanyName(companyNameRaw),
        companyNameRaw,
        city: getField(row, 'City') || null,
        countyName: normalizeCounty(countyNameRaw),
        countyNameRaw,
        industry: getField(row, 'Industry', 'NAICS') || null,
        impacted: parseNumber(getField(row, 'Employees Affected', 'Number Affected', 'Impacted', 'Number of Employees', '# Employees')),
        noticeDate,
        effectiveDate: parseDate(getField(row, 'Effective Date', 'Layoff Date')),
        receivedDate: parseDate(getField(row, 'Received Date', 'Date Received')),
        notes: getField(row, 'Notes', 'Comments') || null,
        addressRaw: getField(row, 'Address') || null,
        zip: getField(row, 'Zip', 'ZIP') || null,
      });
    } catch (error) {
      logger.warn({ error, row }, 'Failed to parse row');
    }
  }

  return records;
}

/**
 * Fetch CSV data from NC Commerce website
 */
async function fetchFromUrl(): Promise<string | null> {
  logger.info('Attempting to fetch WARN data from NC Commerce');

  try {
    // Try known CSV endpoint patterns
    const csvUrls = [
      `${NC_WARN_SOURCE_URL}/warn-notices.csv`,
      `${NC_WARN_SOURCE_URL}/export/csv`,
      NC_WARN_SOURCE_URL,
    ];

    for (const url of csvUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'NCWarn/1.0 (Public Data Aggregator)',
            'Accept': 'text/csv, application/csv, text/plain, */*',
          },
        });

        if (response.ok) {
          const text = await response.text();
          // Check if it looks like CSV
          if (text.includes(',') && (text.includes('Company') || text.includes('Employer'))) {
            logger.info({ url }, 'Successfully fetched CSV');
            return text;
          }
        }
      } catch (e) {
        // Try next URL
      }
    }

    logger.warn('Could not fetch CSV from any known URL');
    return null;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch from URL');
    return null;
  }
}

/**
 * Read CSV from manual upload file
 */
async function readFromFile(): Promise<string | null> {
  const filePath = process.env.NC_WARN_CSV_PATH || MANUAL_CSV_PATH;

  try {
    if (fs.existsSync(filePath)) {
      logger.info({ filePath }, 'Reading from manual CSV file');
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (error) {
    logger.error({ error, filePath }, 'Failed to read manual CSV');
  }

  return null;
}

/**
 * Get or create Company record
 */
async function getOrCreateCompany(
  prisma: PrismaClient,
  name: string,
  rawName: string
): Promise<number> {
  const slug = slugifyCompany(name);

  // Try to find existing
  let company = await prisma.company.findUnique({
    where: { slug },
  });

  if (company) {
    // Add raw name variation if not already present
    if (!company.nameVariations.includes(rawName)) {
      await prisma.company.update({
        where: { id: company.id },
        data: {
          nameVariations: { push: rawName },
        },
      });
    }
    return company.id;
  }

  // Create new
  company = await prisma.company.create({
    data: {
      name,
      slug,
      nameVariations: [rawName],
    },
  });

  return company.id;
}

/**
 * Find county by name (fuzzy match)
 */
async function findCounty(
  prisma: PrismaClient,
  stateId: number,
  countyName: string
): Promise<number | null> {
  const normalized = normalizeCounty(countyName);
  const slug = slugifyCounty(countyName);

  // Try exact slug match first
  let county = await prisma.county.findFirst({
    where: {
      stateId,
      slug,
    },
  });

  if (county) return county.id;

  // Try name contains
  county = await prisma.county.findFirst({
    where: {
      stateId,
      name: {
        contains: normalized,
        mode: 'insensitive',
      },
    },
  });

  return county?.id || null;
}

/**
 * Main import function
 */
export async function importNcWarnNotices(
  prisma: PrismaClient,
  options: { source?: 'url' | 'file' | 'auto' } = {}
): Promise<ImportResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  logger.info({ options }, 'Starting NC WARN import');

  // Create ImportRun record
  const state = await prisma.state.findUnique({ where: { code: STATE_CODE } });
  if (!state) {
    throw new Error('NC state not found - run seed script first');
  }

  const importRun = await prisma.importRun.create({
    data: {
      stateId: state.id,
      source: options.source || 'auto',
      status: 'running',
    },
  });

  try {
    // Get CSV data
    let csvText: string | null = null;
    const source = options.source || 'auto';

    if (source === 'url' || source === 'auto') {
      csvText = await fetchFromUrl();
    }

    if (!csvText && (source === 'file' || source === 'auto')) {
      csvText = await readFromFile();
    }

    if (!csvText) {
      throw new Error('No data source available - URL fetch failed and no manual CSV found');
    }

    // Parse CSV
    const notices = parseCsv(csvText);
    logger.info({ count: notices.length }, 'Parsed notices from CSV');

    // Update ImportRun with items found
    await prisma.importRun.update({
      where: { id: importRun.id },
      data: { itemsFound: notices.length },
    });

    // Process each notice
    let upserted = 0;
    let skipped = 0;

    for (const notice of notices) {
      try {
        // Generate dedupe hash
        const dedupeHash = generateDedupeHash({
          stateCode: STATE_CODE,
          companyName: notice.companyName,
          county: notice.countyName,
          noticeDate: notice.noticeDate,
          impacted: notice.impacted,
        });

        // Check if already exists
        const existing = await prisma.warnNotice.findUnique({
          where: { dedupeHash },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Get or create company
        const companyId = await getOrCreateCompany(prisma, notice.companyName, notice.companyNameRaw);

        // Find county
        const countyId = await findCounty(prisma, state.id, notice.countyName);

        // Create notice
        await prisma.warnNotice.create({
          data: {
            stateId: state.id,
            countyId,
            companyId,
            employer: notice.companyNameRaw,
            companyNameRaw: notice.companyNameRaw,
            countyNameRaw: notice.countyNameRaw,
            city: notice.city,
            zip: notice.zip,
            industry: notice.industry,
            impacted: notice.impacted,
            noticeDate: notice.noticeDate,
            effectiveOn: notice.effectiveDate,
            receivedDate: notice.receivedDate,
            notes: notice.notes,
            addressRaw: notice.addressRaw,
            sourceUrl: NC_WARN_SOURCE_URL,
            dedupeHash,
          },
        });

        upserted++;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to process ${notice.companyNameRaw}: ${errMsg}`);
        logger.warn({ error, notice: notice.companyNameRaw }, 'Failed to process notice');
      }
    }

    // Update ImportRun
    const duration = Date.now() - startTime;
    await prisma.importRun.update({
      where: { id: importRun.id },
      data: {
        status: errors.length > 0 ? 'partial' : 'completed',
        finishedAt: new Date(),
        itemsUpserted: upserted,
        itemsSkipped: skipped,
        errorSummary: errors.length > 0 ? errors.slice(0, 10).join('\n') : null,
      },
    });

    logger.info({ upserted, skipped, errors: errors.length, duration }, 'Import completed');

    return {
      success: true,
      itemsFound: notices.length,
      itemsUpserted: upserted,
      itemsSkipped: skipped,
      errors,
      duration,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    errors.push(errMsg);

    await prisma.importRun.update({
      where: { id: importRun.id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        errorSummary: errMsg,
      },
    });

    logger.error({ error }, 'Import failed');

    return {
      success: false,
      itemsFound: 0,
      itemsUpserted: 0,
      itemsSkipped: 0,
      errors,
      duration: Date.now() - startTime,
    };
  }
}
