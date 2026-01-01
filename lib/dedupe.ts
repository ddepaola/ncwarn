/**
 * Deduplication utilities for WARN notices
 * Generates stable hashes for upsert operations
 */

import { createHash } from 'crypto';
import { normalizeCompanyName, normalizeCounty } from './normalize';

export interface DedupeInput {
  stateCode: string;
  companyName: string;
  county?: string | null;
  noticeDate: Date | string;
  impacted?: number | null;
  effectiveDate?: Date | string | null;
}

/**
 * Generate a stable dedupe hash from notice fields
 *
 * The hash is based on:
 * - State code (e.g., 'NC')
 * - Normalized company name
 * - Normalized county name
 * - Notice date (YYYY-MM-DD)
 * - Number of impacted employees
 *
 * This allows us to detect duplicates even when raw field values vary slightly.
 */
export function generateDedupeHash(input: DedupeInput): string {
  const normalizedCompany = normalizeCompanyName(input.companyName);
  const normalizedCounty = input.county ? normalizeCounty(input.county) : '';

  // Format date as YYYY-MM-DD
  const noticeDate = typeof input.noticeDate === 'string'
    ? input.noticeDate.slice(0, 10)
    : input.noticeDate.toISOString().slice(0, 10);

  // Build composite key
  const parts = [
    input.stateCode.toUpperCase(),
    normalizedCompany,
    normalizedCounty,
    noticeDate,
    String(input.impacted || 0),
  ];

  const compositeKey = parts.join('|');

  // Generate SHA-256 hash
  return createHash('sha256').update(compositeKey).digest('hex');
}

/**
 * Check if two notices are likely duplicates based on key fields
 * (without computing full hash)
 */
export function areLikelyDuplicates(
  a: DedupeInput,
  b: DedupeInput
): boolean {
  if (a.stateCode !== b.stateCode) return false;

  const aCompany = normalizeCompanyName(a.companyName);
  const bCompany = normalizeCompanyName(b.companyName);
  if (aCompany !== bCompany) return false;

  const aDate = typeof a.noticeDate === 'string'
    ? a.noticeDate.slice(0, 10)
    : a.noticeDate.toISOString().slice(0, 10);
  const bDate = typeof b.noticeDate === 'string'
    ? b.noticeDate.slice(0, 10)
    : b.noticeDate.toISOString().slice(0, 10);
  if (aDate !== bDate) return false;

  // Same company, same date = likely duplicate
  return true;
}
