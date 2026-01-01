/**
 * Normalization utilities for WARN notice data
 * Used for deduplication and consistent display
 */

/**
 * Normalize company name for deduplication and matching
 * Removes common suffixes, lowercases, and collapses whitespace
 */
export function normalizeCompanyName(name: string): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .trim()
    // Remove common corporate suffixes
    .replace(/\b(inc\.?|incorporated|llc|llp|l\.l\.c\.?|corp\.?|corporation|co\.?|company|ltd\.?|limited|plc|pllc|lp|l\.p\.)\b/gi, '')
    // Remove "d/b/a" and anything after
    .replace(/\s*d\/?b\/?a\s*.*/i, '')
    // Remove punctuation except hyphens
    .replace(/[.,'"()]/g, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate a URL-safe slug from a company name
 */
export function slugifyCompany(name: string): string {
  if (!name) return '';

  return normalizeCompanyName(name)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Normalize county name for matching
 */
export function normalizeCounty(name: string): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .trim()
    .replace(/\s+county$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate a URL-safe slug from a county name
 */
export function slugifyCounty(name: string): string {
  if (!name) return '';

  return normalizeCounty(name)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Normalize state name to code
 */
export const STATE_NAME_TO_CODE: Record<string, string> = {
  'alabama': 'AL',
  'alaska': 'AK',
  'arizona': 'AZ',
  'arkansas': 'AR',
  'california': 'CA',
  'colorado': 'CO',
  'connecticut': 'CT',
  'delaware': 'DE',
  'florida': 'FL',
  'georgia': 'GA',
  'hawaii': 'HI',
  'idaho': 'ID',
  'illinois': 'IL',
  'indiana': 'IN',
  'iowa': 'IA',
  'kansas': 'KS',
  'kentucky': 'KY',
  'louisiana': 'LA',
  'maine': 'ME',
  'maryland': 'MD',
  'massachusetts': 'MA',
  'michigan': 'MI',
  'minnesota': 'MN',
  'mississippi': 'MS',
  'missouri': 'MO',
  'montana': 'MT',
  'nebraska': 'NE',
  'nevada': 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  'ohio': 'OH',
  'oklahoma': 'OK',
  'oregon': 'OR',
  'pennsylvania': 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  'tennessee': 'TN',
  'texas': 'TX',
  'utah': 'UT',
  'vermont': 'VT',
  'virginia': 'VA',
  'washington': 'WA',
  'west virginia': 'WV',
  'wisconsin': 'WI',
  'wyoming': 'WY',
};

export const STATE_CODE_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAME_TO_CODE).map(([name, code]) => [code, name])
);

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date as YYYY-MM for URL paths
 */
export function formatDatePath(date: Date | string): { year: string; month: string } {
  const d = typeof date === 'string' ? new Date(date) : date;
  return {
    year: d.getFullYear().toString(),
    month: (d.getMonth() + 1).toString().padStart(2, '0'),
  };
}

/**
 * Get month name from number (1-12)
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}
