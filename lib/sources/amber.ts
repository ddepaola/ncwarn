import { XMLParser } from 'fast-xml-parser';
import { createLogger } from '../logger';

const logger = createLogger('source:amber');

// AMBER Alert sources
const AMBER_RSS_URL = 'https://www.missingkids.org/missingkids/servlet/RSSServlet';
const NC_AMBER_URL = 'https://www.ncdoj.gov/amber-alert/';

export interface AmberAlertRecord {
  caseId: string;
  status: string;
  title: string;
  description: string | null;
  region: string | null;
  issuedAt: Date;
  imageUrl: string | null;
  sourceUrl: string;
}

interface RssItem {
  title?: string;
  description?: string;
  link?: string;
  pubDate?: string;
  guid?: string;
}

export async function fetchAmberAlerts(): Promise<AmberAlertRecord[]> {
  logger.info('Fetching AMBER alerts');
  const alerts: AmberAlertRecord[] = [];

  // Try NCMEC RSS feed
  try {
    const ncmecAlerts = await fetchFromNcmec();
    // Filter for NC-related alerts
    const ncAlerts = ncmecAlerts.filter(a =>
      a.region?.includes('NC') ||
      a.region?.includes('North Carolina') ||
      a.description?.includes('North Carolina') ||
      a.description?.includes('NC')
    );
    alerts.push(...ncAlerts);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch from NCMEC');
  }

  // Try NC DOJ page
  try {
    const dojAlerts = await fetchFromNcDoj();
    // Dedupe by caseId
    for (const alert of dojAlerts) {
      if (!alerts.some(a => a.caseId === alert.caseId)) {
        alerts.push(alert);
      }
    }
  } catch (error) {
    logger.error({ error }, 'Failed to fetch from NC DOJ');
  }

  logger.info({ count: alerts.length }, 'Fetched AMBER alerts');
  return alerts;
}

async function fetchFromNcmec(): Promise<AmberAlertRecord[]> {
  const response = await fetch(AMBER_RSS_URL, {
    headers: {
      'User-Agent': 'NCWARN/1.0 (Public Safety Aggregator)',
    },
  });

  if (!response.ok) {
    throw new Error(`NCMEC RSS returned ${response.status}`);
  }

  const xml = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });
  const parsed = parser.parse(xml);
  const items: RssItem[] = parsed?.rss?.channel?.item || [];

  const itemList = Array.isArray(items) ? items : items ? [items as RssItem] : [];

  return itemList.map((item, index) => ({
    caseId: item.guid || `ncmec-${index}-${Date.now()}`,
    status: 'active',
    title: item.title || 'AMBER Alert',
    description: item.description || null,
    region: extractRegion(item.description || ''),
    issuedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
    imageUrl: null,
    sourceUrl: item.link || AMBER_RSS_URL,
  }));
}

async function fetchFromNcDoj(): Promise<AmberAlertRecord[]> {
  // NC DOJ AMBER page - would need HTML parsing
  // For now, return empty as the actual structure varies
  logger.info('NC DOJ AMBER fetch - placeholder');
  return [];
}

function extractRegion(text: string): string | null {
  // Try to extract state/region from description
  const stateMatches = text.match(/\b(NC|North Carolina|[A-Z]{2})\b/g);
  if (stateMatches && stateMatches.length > 0) {
    return stateMatches.join(', ');
  }
  return null;
}

export async function getActiveAmberAlerts(): Promise<AmberAlertRecord[]> {
  const alerts = await fetchAmberAlerts();
  return alerts.filter(a => a.status === 'active');
}

export function isAlertActive(alert: AmberAlertRecord): boolean {
  // AMBER alerts are typically active for 24-48 hours
  const hoursSinceIssued = (Date.now() - alert.issuedAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceIssued < 48 && alert.status === 'active';
}
