import { XMLParser } from 'fast-xml-parser';
import { createLogger } from '../logger';

const logger = createLogger('source:weather');

// NWS API for North Carolina alerts
const NWS_API_BASE = 'https://api.weather.gov';
const NC_STATE_CODE = 'NC';

export interface WeatherAlertRecord {
  id: string;
  event: string;
  status: string;
  severity: string | null;
  certainty: string | null;
  urgency: string | null;
  headline: string | null;
  description: string | null;
  instruction: string | null;
  startsAt: Date;
  endsAt: Date | null;
  counties: string[];
  zones: string[];
  sourceUrl: string;
}

interface NWSAlert {
  id: string;
  properties: {
    event: string;
    status: string;
    severity: string;
    certainty: string;
    urgency: string;
    headline: string;
    description: string;
    instruction: string;
    effective: string;
    expires: string;
    areaDesc: string;
    geocode?: {
      FIPS6?: string[];
      UGC?: string[];
    };
  };
}

export async function fetchWeatherAlerts(): Promise<WeatherAlertRecord[]> {
  logger.info('Fetching weather alerts from NWS');

  try {
    const response = await fetch(`${NWS_API_BASE}/alerts/active?area=${NC_STATE_CODE}`, {
      headers: {
        'User-Agent': 'NCWARN/1.0 (ncwarn.com, contact@ncwarn.com)',
        Accept: 'application/geo+json',
      },
    });

    if (!response.ok) {
      throw new Error(`NWS API returned ${response.status}`);
    }

    const data = await response.json();
    const alerts: WeatherAlertRecord[] = [];

    for (const feature of data.features || []) {
      const alert = feature as NWSAlert;
      const props = alert.properties;

      // Extract county names from area description
      const counties = extractCounties(props.areaDesc);

      alerts.push({
        id: alert.id,
        event: props.event,
        status: props.status,
        severity: props.severity || null,
        certainty: props.certainty || null,
        urgency: props.urgency || null,
        headline: props.headline || null,
        description: props.description || null,
        instruction: props.instruction || null,
        startsAt: new Date(props.effective),
        endsAt: props.expires ? new Date(props.expires) : null,
        counties,
        zones: props.geocode?.UGC || [],
        sourceUrl: `https://alerts.weather.gov/cap/wwacapget.php?x=${encodeURIComponent(alert.id)}`,
      });
    }

    logger.info({ count: alerts.length }, 'Fetched weather alerts');
    return alerts;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch weather alerts');
    return [];
  }
}

function extractCounties(areaDesc: string): string[] {
  // Area descriptions look like: "Alamance; Caswell; Orange" or include state
  if (!areaDesc) return [];

  return areaDesc
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.includes('NC') && !s.includes('North Carolina'))
    .map(s => s.replace(/\s*County$/i, '').trim());
}

export async function fetchAlertsByCounty(countyName: string): Promise<WeatherAlertRecord[]> {
  const alerts = await fetchWeatherAlerts();
  const normalizedCounty = countyName.toLowerCase();

  return alerts.filter(alert =>
    alert.counties.some(c => c.toLowerCase() === normalizedCounty)
  );
}

export function categorizeAlert(event: string): string {
  const eventLower = event.toLowerCase();

  if (eventLower.includes('tornado') || eventLower.includes('wind')) return 'wind';
  if (eventLower.includes('flood') || eventLower.includes('rain')) return 'flood';
  if (eventLower.includes('fire') || eventLower.includes('red flag')) return 'fire';
  if (eventLower.includes('heat') || eventLower.includes('excessive')) return 'heat';
  if (eventLower.includes('winter') || eventLower.includes('ice') || eventLower.includes('snow') || eventLower.includes('freeze')) return 'winter';
  if (eventLower.includes('hurricane') || eventLower.includes('tropical')) return 'tropical';
  if (eventLower.includes('thunder') || eventLower.includes('severe')) return 'severe';

  return 'other';
}

export function getSeverityLevel(severity: string | null): number {
  switch (severity?.toLowerCase()) {
    case 'extreme':
      return 4;
    case 'severe':
      return 3;
    case 'moderate':
      return 2;
    case 'minor':
      return 1;
    default:
      return 0;
  }
}
