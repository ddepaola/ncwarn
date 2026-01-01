import { createLogger } from '../logger';

const logger = createLogger('source:recalls');

// Federal recall APIs
const NHTSA_API = 'https://api.nhtsa.gov/recalls/recallsByState?state=NC';
const CPSC_API = 'https://www.saferproducts.gov/RestWebServices/Recall';
const FDA_API = 'https://api.fda.gov/food/enforcement.json';
const FSIS_API = 'https://www.fsis.usda.gov/recalls';

export interface RecallRecord {
  agency: 'NHTSA' | 'CPSC' | 'FDA' | 'FSIS';
  recallId: string;
  title: string;
  category: string | null;
  affected: string | null;
  description: string | null;
  hazard: string | null;
  remedy: string | null;
  publishedAt: Date;
  sourceUrl: string;
}

export type RecallType = 'vehicle' | 'product' | 'food';

export async function fetchAllRecalls(): Promise<RecallRecord[]> {
  logger.info('Fetching recalls from federal agencies');
  const allRecalls: RecallRecord[] = [];

  const results = await Promise.allSettled([
    fetchNhtsaRecalls(),
    fetchCpscRecalls(),
    fetchFdaRecalls(),
  ]);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allRecalls.push(...result.value);
    } else {
      logger.error({ error: result.reason }, 'Recall fetch failed');
    }
  }

  // Sort by date, newest first
  allRecalls.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  logger.info({ count: allRecalls.length }, 'Fetched recalls');
  return allRecalls;
}

async function fetchNhtsaRecalls(): Promise<RecallRecord[]> {
  try {
    // NHTSA Vehicle Safety Recalls - fetch current year
    const currentYear = new Date().getFullYear();
    const response = await fetch(
      `https://api.nhtsa.gov/recalls/recallsByYear?year=${currentYear}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`NHTSA API returned ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];

    return results.slice(0, 100).map((recall: Record<string, unknown>) => ({
      agency: 'NHTSA' as const,
      recallId: String(recall.NHTSACampaignNumber || recall.id || ''),
      title: `${recall.Make || ''} ${recall.Model || ''} ${recall.ModelYear || ''}`.trim() || 'Vehicle Recall',
      category: 'vehicle',
      affected: recall.PotentialNumberofUnitsAffected
        ? `${recall.PotentialNumberofUnitsAffected} units`
        : null,
      description: String(recall.Summary || recall.Conequence || ''),
      hazard: String(recall.Consequence || ''),
      remedy: String(recall.Remedy || ''),
      publishedAt: recall.ReportReceivedDate
        ? new Date(String(recall.ReportReceivedDate))
        : new Date(),
      sourceUrl: `https://www.nhtsa.gov/recalls?nhtsaId=${recall.NHTSACampaignNumber}`,
    }));
  } catch (error) {
    logger.error({ error }, 'NHTSA fetch failed');
    return [];
  }
}

async function fetchCpscRecalls(): Promise<RecallRecord[]> {
  try {
    // CPSC Consumer Product Recalls
    const response = await fetch(
      `${CPSC_API}?format=json&RecallDateStart=${getDateString(90)}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CPSC API returned ${response.status}`);
    }

    const data = await response.json();
    const results = Array.isArray(data) ? data : [];

    return results.slice(0, 100).map((recall: Record<string, unknown>) => ({
      agency: 'CPSC' as const,
      recallId: String(recall.RecallID || recall.RecallNumber || ''),
      title: String(recall.Description || recall.Title || 'Product Recall'),
      category: 'product',
      affected: recall.NumberOfUnits ? String(recall.NumberOfUnits) : null,
      description: String(recall.Description || ''),
      hazard: String(recall.Hazard || ''),
      remedy: String(recall.Remedy || ''),
      publishedAt: recall.RecallDate
        ? new Date(String(recall.RecallDate))
        : new Date(),
      sourceUrl: recall.URL
        ? String(recall.URL)
        : `https://www.cpsc.gov/Recalls/${recall.RecallID}`,
    }));
  } catch (error) {
    logger.error({ error }, 'CPSC fetch failed');
    return [];
  }
}

async function fetchFdaRecalls(): Promise<RecallRecord[]> {
  try {
    // FDA Food Recalls and Enforcement
    const response = await fetch(
      `${FDA_API}?search=state:"NC"&limit=100&sort=report_date:desc`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Try without state filter
      const fallbackResponse = await fetch(
        `${FDA_API}?limit=100&sort=report_date:desc`
      );
      if (!fallbackResponse.ok) {
        throw new Error(`FDA API returned ${response.status}`);
      }
      const fallbackData = await fallbackResponse.json();
      return parseFdaResults(fallbackData.results || []);
    }

    const data = await response.json();
    return parseFdaResults(data.results || []);
  } catch (error) {
    logger.error({ error }, 'FDA fetch failed');
    return [];
  }
}

function parseFdaResults(results: Record<string, unknown>[]): RecallRecord[] {
  return results.slice(0, 100).map(recall => ({
    agency: 'FDA' as const,
    recallId: String(recall.recall_number || recall.event_id || ''),
    title: String(recall.product_description || 'Food Recall').slice(0, 200),
    category: 'food',
    affected: recall.product_quantity ? String(recall.product_quantity) : null,
    description: String(recall.reason_for_recall || ''),
    hazard: String(recall.reason_for_recall || ''),
    remedy: String(recall.voluntary_mandated || 'Check with retailer'),
    publishedAt: recall.report_date
      ? new Date(String(recall.report_date))
      : new Date(),
    sourceUrl: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts',
  }));
}

function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

export async function fetchRecallsByType(type: RecallType): Promise<RecallRecord[]> {
  const recalls = await fetchAllRecalls();
  return recalls.filter(r => r.category === type);
}

export async function searchRecalls(query: string): Promise<RecallRecord[]> {
  const recalls = await fetchAllRecalls();
  const q = query.toLowerCase();

  return recalls.filter(
    r =>
      r.title.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.affected?.toLowerCase().includes(q)
  );
}

export const RECALL_TYPES = [
  { id: 'vehicle', label: 'Vehicle Recalls', agency: 'NHTSA' },
  { id: 'product', label: 'Product Recalls', agency: 'CPSC' },
  { id: 'food', label: 'Food Recalls', agency: 'FDA/FSIS' },
];
