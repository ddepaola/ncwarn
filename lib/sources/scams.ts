import { XMLParser } from 'fast-xml-parser';
import { createLogger } from '../logger';

const logger = createLogger('source:scams');

// NC DOJ Consumer Protection / Scam alerts
const NC_DOJ_RSS_URL = 'https://www.ncdoj.gov/feed/';
const NC_DOJ_SCAM_URL = 'https://www.ncdoj.gov/protecting-consumers/consumer-alerts/';

export interface ScamAlertRecord {
  title: string;
  category: string | null;
  summary: string | null;
  content: string | null;
  publishedAt: Date;
  sourceUrl: string;
}

interface RssItem {
  title?: string;
  description?: string;
  'content:encoded'?: string;
  link?: string;
  pubDate?: string;
  category?: string | string[];
}

export async function fetchScamAlerts(): Promise<ScamAlertRecord[]> {
  logger.info('Fetching scam alerts from NC DOJ');

  try {
    const response = await fetch(NC_DOJ_RSS_URL, {
      headers: {
        'User-Agent': 'NCWARN/1.0 (Public Safety Aggregator)',
      },
    });

    if (!response.ok) {
      throw new Error(`NC DOJ RSS returned ${response.status}`);
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const parsed = parser.parse(xml);

    const items: RssItem[] = parsed?.rss?.channel?.item || [];
    const alerts: ScamAlertRecord[] = [];

    const itemList = Array.isArray(items) ? items : [items];

    for (const item of itemList) {
      // Filter for scam/consumer alert content
      const isScamRelated = isScamContent(item);
      if (!isScamRelated) continue;

      alerts.push({
        title: item.title || 'Consumer Alert',
        category: extractCategory(item.category),
        summary: cleanHtml(item.description || ''),
        content: cleanHtml(item['content:encoded'] || ''),
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        sourceUrl: item.link || NC_DOJ_SCAM_URL,
      });
    }

    logger.info({ count: alerts.length }, 'Fetched scam alerts');
    return alerts;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch scam alerts');
    return [];
  }
}

function isScamContent(item: RssItem): boolean {
  const searchText = [
    item.title || '',
    item.description || '',
    Array.isArray(item.category) ? item.category.join(' ') : item.category || '',
  ]
    .join(' ')
    .toLowerCase();

  const scamKeywords = [
    'scam',
    'fraud',
    'alert',
    'warning',
    'consumer',
    'phishing',
    'identity theft',
    'impersonat',
    'fake',
    'scheme',
    'deceptive',
    'robocall',
    'telemarket',
  ];

  return scamKeywords.some(keyword => searchText.includes(keyword));
}

function extractCategory(category: string | string[] | undefined): string | null {
  if (!category) return null;
  if (Array.isArray(category)) {
    return category[0] || null;
  }
  return category;
}

function cleanHtml(html: string): string | null {
  if (!html) return null;
  // Remove HTML tags and decode entities
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchScamsByCategory(category: string): Promise<ScamAlertRecord[]> {
  const alerts = await fetchScamAlerts();
  const normalizedCategory = category.toLowerCase();

  return alerts.filter(
    a => a.category?.toLowerCase().includes(normalizedCategory)
  );
}

export function categorizeScam(title: string, summary: string | null): string {
  const text = `${title} ${summary || ''}`.toLowerCase();

  if (text.includes('phone') || text.includes('call') || text.includes('robocall')) {
    return 'phone';
  }
  if (text.includes('email') || text.includes('phishing')) {
    return 'email';
  }
  if (text.includes('identity') || text.includes('theft')) {
    return 'identity';
  }
  if (text.includes('tax') || text.includes('irs')) {
    return 'tax';
  }
  if (text.includes('medicare') || text.includes('health') || text.includes('medical')) {
    return 'healthcare';
  }
  if (text.includes('utility') || text.includes('power') || text.includes('electric')) {
    return 'utility';
  }
  if (text.includes('government') || text.includes('official')) {
    return 'government';
  }
  if (text.includes('online') || text.includes('internet') || text.includes('website')) {
    return 'online';
  }
  if (text.includes('senior') || text.includes('elderly')) {
    return 'senior';
  }

  return 'general';
}

export const SCAM_CATEGORIES = [
  { id: 'phone', label: 'Phone Scams' },
  { id: 'email', label: 'Email/Phishing' },
  { id: 'identity', label: 'Identity Theft' },
  { id: 'tax', label: 'Tax Fraud' },
  { id: 'healthcare', label: 'Healthcare Fraud' },
  { id: 'utility', label: 'Utility Scams' },
  { id: 'government', label: 'Government Impersonation' },
  { id: 'online', label: 'Online Fraud' },
  { id: 'senior', label: 'Senior Targeted' },
  { id: 'general', label: 'General' },
];
