import { createLogger } from '../logger';

const logger = createLogger('source:outages');

// NC Power utilities
const UTILITIES = {
  duke: {
    name: 'Duke Energy',
    apiUrl: 'https://outagemap.duke-energy.com/ncsc/api/v1/outages',
    website: 'https://www.duke-energy.com/outages',
  },
  dominion: {
    name: 'Dominion Energy',
    apiUrl: 'https://outagemap.dominionenergy.com/api/v1/outages',
    website: 'https://www.dominionenergy.com/outages',
  },
  // EMCs use various platforms - would need individual integrations
};

export interface OutageRecord {
  utility: string;
  county: string;
  customersOut: number;
  customersTot: number | null;
  reportedAt: Date;
  estimatedRestoration: Date | null;
  cause: string | null;
  sourceUrl: string;
}

export interface OutageSummary {
  totalCustomersOut: number;
  byUtility: { [key: string]: number };
  byCounty: { [key: string]: number };
  lastUpdated: Date;
}

export async function fetchAllOutages(): Promise<OutageRecord[]> {
  logger.info('Fetching power outages');
  const allOutages: OutageRecord[] = [];

  // Fetch from each utility
  const results = await Promise.allSettled([
    fetchDukeOutages(),
    fetchDominionOutages(),
    fetchEmcOutages(),
  ]);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allOutages.push(...result.value);
    } else {
      logger.error({ error: result.reason }, 'Utility fetch failed');
    }
  }

  logger.info({ count: allOutages.length }, 'Fetched outages');
  return allOutages;
}

async function fetchDukeOutages(): Promise<OutageRecord[]> {
  try {
    // Duke Energy has a public outage API
    // The actual endpoint structure may vary
    const response = await fetch(`${UTILITIES.duke.apiUrl}?state=NC`, {
      headers: {
        'User-Agent': 'NCWARN/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      logger.warn(`Duke outage API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return parseOutageResponse(data, 'Duke Energy', UTILITIES.duke.website);
  } catch (error) {
    logger.error({ error }, 'Duke outage fetch failed');
    return [];
  }
}

async function fetchDominionOutages(): Promise<OutageRecord[]> {
  try {
    const response = await fetch(`${UTILITIES.dominion.apiUrl}?state=NC`, {
      headers: {
        'User-Agent': 'NCWARN/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      logger.warn(`Dominion outage API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return parseOutageResponse(data, 'Dominion Energy', UTILITIES.dominion.website);
  } catch (error) {
    logger.error({ error }, 'Dominion outage fetch failed');
    return [];
  }
}

async function fetchEmcOutages(): Promise<OutageRecord[]> {
  // EMCs (Electric Membership Cooperatives) in NC
  // These would need individual integrations based on their platforms
  // Common platforms: NISC, Futura, custom
  logger.info('EMC outage fetch - placeholder');
  return [];
}

function parseOutageResponse(
  data: unknown,
  utilityName: string,
  sourceUrl: string
): OutageRecord[] {
  const records: OutageRecord[] = [];

  // Generic parsing - actual structure depends on utility API
  if (!data || typeof data !== 'object') return records;

  const outages = Array.isArray(data)
    ? data
    : (data as Record<string, unknown>).outages ||
      (data as Record<string, unknown>).data ||
      [];

  for (const outage of outages as Record<string, unknown>[]) {
    const county = String(outage.county || outage.countyName || '');
    const customersOut = Number(outage.customersAffected || outage.affected || 0);

    if (!county || customersOut <= 0) continue;

    records.push({
      utility: utilityName,
      county,
      customersOut,
      customersTot: outage.totalCustomers ? Number(outage.totalCustomers) : null,
      reportedAt: outage.reportedAt ? new Date(String(outage.reportedAt)) : new Date(),
      estimatedRestoration: outage.etr ? new Date(String(outage.etr)) : null,
      cause: outage.cause ? String(outage.cause) : null,
      sourceUrl,
    });
  }

  return records;
}

export async function fetchOutagesByCounty(county: string): Promise<OutageRecord[]> {
  const allOutages = await fetchAllOutages();
  const normalizedCounty = county.toLowerCase();

  return allOutages.filter(
    o => o.county.toLowerCase() === normalizedCounty
  );
}

export async function getOutageSummary(): Promise<OutageSummary> {
  const outages = await fetchAllOutages();

  const byUtility: { [key: string]: number } = {};
  const byCounty: { [key: string]: number } = {};
  let totalCustomersOut = 0;

  for (const outage of outages) {
    totalCustomersOut += outage.customersOut;
    byUtility[outage.utility] = (byUtility[outage.utility] || 0) + outage.customersOut;
    byCounty[outage.county] = (byCounty[outage.county] || 0) + outage.customersOut;
  }

  return {
    totalCustomersOut,
    byUtility,
    byCounty,
    lastUpdated: new Date(),
  };
}

export function getUtilityReportUrl(utility: string): string {
  switch (utility.toLowerCase()) {
    case 'duke':
    case 'duke energy':
      return 'https://www.duke-energy.com/outages/report-outage';
    case 'dominion':
    case 'dominion energy':
      return 'https://www.dominionenergy.com/outages/report-outage';
    default:
      return 'https://www.electriccooperative.com/report-outage/';
  }
}
