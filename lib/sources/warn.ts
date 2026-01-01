import Papa from 'papaparse';
import { createLogger } from '../logger';

const logger = createLogger('source:warn');

// NC Commerce WARN Act notices
const WARN_SOURCE_URL = 'https://www.commerce.nc.gov/data/warn-notices';

export interface WarnRecord {
  employer: string;
  city: string | null;
  county: string;
  industry: string | null;
  impacted: number | null;
  noticeDate: Date;
  effectiveOn: Date | null;
  notes: string | null;
  sourceUrl: string;
}

interface RawWarnRow {
  'Company Name'?: string;
  'Company'?: string;
  'Employer'?: string;
  'City'?: string;
  'County'?: string;
  'Industry'?: string;
  'Employees Affected'?: string;
  'Number Affected'?: string;
  'Impacted'?: string;
  'Notice Date'?: string;
  'Received Date'?: string;
  'Effective Date'?: string;
  'Layoff Date'?: string;
  'Notes'?: string;
  'Comments'?: string;
}

function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function parseNumber(numStr: string | undefined): number | null {
  if (!numStr) return null;
  const cleaned = numStr.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

export async function fetchWarnNotices(): Promise<WarnRecord[]> {
  logger.info('Fetching WARN notices from NC Commerce');

  try {
    // Try to fetch CSV from NC Commerce
    // The actual URL may need adjustment based on current site structure
    const csvUrl = `${WARN_SOURCE_URL}/warn-notices.csv`;
    const response = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'NCWARN/1.0 (Public Data Aggregator)',
      },
    });

    if (!response.ok) {
      logger.warn(`CSV fetch failed (${response.status}), trying HTML fallback`);
      return await fetchWarnFromHtml();
    }

    const csvText = await response.text();
    return parseWarnCsv(csvText);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch WARN notices');
    return [];
  }
}

function parseWarnCsv(csvText: string): WarnRecord[] {
  const records: WarnRecord[] = [];

  const result = Papa.parse<RawWarnRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  for (const row of result.data) {
    const employer =
      row['Company Name'] || row['Company'] || row['Employer'] || '';
    if (!employer) continue;

    const county = row['County'] || '';
    if (!county) continue;

    const noticeDate = parseDate(row['Notice Date'] || row['Received Date']);
    if (!noticeDate) continue;

    records.push({
      employer: employer.trim(),
      city: row['City']?.trim() || null,
      county: county.trim(),
      industry: row['Industry']?.trim() || null,
      impacted: parseNumber(
        row['Employees Affected'] || row['Number Affected'] || row['Impacted']
      ),
      noticeDate,
      effectiveOn: parseDate(row['Effective Date'] || row['Layoff Date']),
      notes: row['Notes']?.trim() || row['Comments']?.trim() || null,
      sourceUrl: WARN_SOURCE_URL,
    });
  }

  logger.info({ count: records.length }, 'Parsed WARN notices from CSV');
  return records;
}

async function fetchWarnFromHtml(): Promise<WarnRecord[]> {
  // Fallback HTML parsing if CSV is not available
  // This would need to be adapted to the actual HTML structure
  logger.info('Attempting HTML fallback for WARN notices');

  try {
    const response = await fetch(WARN_SOURCE_URL, {
      headers: {
        'User-Agent': 'NCWARN/1.0 (Public Data Aggregator)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    // Parse HTML table - implementation would depend on actual page structure
    // For now, return empty and rely on CSV
    logger.warn('HTML parsing not implemented, returning empty');
    return [];
  } catch (error) {
    logger.error({ error }, 'HTML fallback failed');
    return [];
  }
}

export async function fetchRecentWarnNotices(days: number = 90): Promise<WarnRecord[]> {
  const all = await fetchWarnNotices();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return all.filter(r => r.noticeDate >= cutoff);
}
