import { db, schema } from "@/lib/db";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { LngLat } from "@/lib/db/types";
import { CRIME_CATEGORIES, CATEGORY_LABELS, type CrimeCategory } from "./categories";
import { computeTrend, MILES_TO_METERS, RADIUS_MILES, TIME_RANGES_DAYS, type Trend } from "./trend";

/**
 * Crime radius statistics (handoff §7.2). Rules enforced here, not in the UI:
 *  - counts are reported incidents within a radius of the geocoded point, own-period trend only;
 *  - a period is "complete" only when the source's imported history fully covers it, so a
 *    percentage is never computed against a partially-backfilled baseline;
 *  - non-criminal NIBRS 8xx records are excluded from counts and listed separately as a note;
 *  - precision is never increased beyond the source (block-level masked coordinates).
 */
export type RadiusMiles = (typeof RADIUS_MILES)[number];
export type RangeDays = (typeof TIME_RANGES_DAYS)[number];

/** Municipalities inside Mecklenburg County that CMPD does not police (own departments). */
export const NON_CMPD_MECKLENBURG_MUNICIPALITIES = ["Huntersville", "Cornelius", "Davidson", "Matthews", "Mint Hill", "Pineville"];

export interface CrimeStats {
  sourceKey: string;
  radiusMiles: RadiusMiles;
  rangeDays: RangeDays;
  radiusMeters: number;
  currentStart: Date; currentEnd: Date; previousStart: Date;
  dataFrom: Date | null;      // earliest imported reported_at
  dataThrough: Date | null;   // latest reported_at successfully imported (source_updated_at)
  currentComplete: boolean; previousComplete: boolean;
  total: number; previousTotal: number;
  nonCriminalExcluded: number;
  categories: Array<{ category: CrimeCategory; label: string; count: number; previous: number }>;
  trend: Trend;
  recent: Array<{ id: string; reportedAt: Date; category: CrimeCategory; agencyClassification: string; locationText: string | null; distanceMiles: number; clearanceStatus: string | null }>;
}

export function parseRadius(v: unknown): RadiusMiles {
  const n = Number(v);
  return (RADIUS_MILES as readonly number[]).includes(n) ? (n as RadiusMiles) : 1;
}
export function parseRange(v: unknown): RangeDays {
  const n = Number(v);
  return (TIME_RANGES_DAYS as readonly number[]).includes(n) ? (n as RangeDays) : 90;
}

export async function crimeStatsNear(point: LngLat, opts: { radiusMiles: RadiusMiles; rangeDays: RangeDays; sourceKey?: string; now?: Date }): Promise<CrimeStats | null> {
  const sourceKey = opts.sourceKey ?? "cmpd_incidents";
  const [source] = await db.select({ id: schema.sources.id }).from(schema.sources).where(eq(schema.sources.key, sourceKey)).limit(1);
  if (!source) return null;
  const [cov] = await db.select({ lastSuccessAt: schema.coverageStatus.lastSuccessAt, sourceUpdatedAt: schema.coverageStatus.sourceUpdatedAt })
    .from(schema.coverageStatus).where(and(eq(schema.coverageStatus.sourceId, source.id), isNull(schema.coverageStatus.jurisdictionId))).limit(1);
  if (!cov?.lastSuccessAt) return null; // never imported → caller shows coverage state, not zeros

  const [bounds] = await db.select({ min: sql<Date | null>`min(${schema.crimeIncidents.reportedAt})`, max: sql<Date | null>`max(${schema.crimeIncidents.reportedAt})` })
    .from(schema.crimeIncidents).where(eq(schema.crimeIncidents.sourceId, source.id));
  const dataFrom = bounds?.min ? new Date(bounds.min) : null;
  const dataThrough = cov.sourceUpdatedAt ?? (bounds?.max ? new Date(bounds.max) : null);

  const now = opts.now ?? new Date();
  const day = 86400000;
  // Anchor the window at the latest imported day so a delayed source shows "through <date>" rather than silently shrinking counts.
  const currentEnd = dataThrough && dataThrough < now ? new Date(dataThrough.getTime() + day) : now;
  const currentStart = new Date(currentEnd.getTime() - opts.rangeDays * day);
  const previousStart = new Date(currentStart.getTime() - opts.rangeDays * day);
  const currentComplete = !!dataFrom && dataFrom <= currentStart;
  const previousComplete = !!dataFrom && dataFrom <= previousStart;

  // Raw sql`` params bypass Drizzle's column mappers, so bind dates as ISO strings with explicit casts.
  const tsCur = sql`${currentStart.toISOString()}::timestamptz`, tsPrev = sql`${previousStart.toISOString()}::timestamptz`, tsEnd = sql`${currentEnd.toISOString()}::timestamptz`;
  const radiusMeters = opts.radiusMiles * MILES_TO_METERS;
  const origin = sql`ST_SetSRID(ST_MakePoint(${point.lng}::float8, ${point.lat}::float8), 4326)::geography`;
  const within = sql`ST_DWithin(${schema.crimeIncidents.point}, ${origin}, ${radiusMeters}::float8)`;
  const base = and(eq(schema.crimeIncidents.sourceId, source.id), within);

  const periodExpr = sql<string>`case when ${schema.crimeIncidents.reportedAt} >= ${tsCur} then 'current' else 'previous' end`;
  const rows = await db.select({
    category: schema.crimeIncidents.category,
    nonCriminal: schema.crimeIncidents.nonCriminal,
    period: periodExpr,
    n: sql<number>`count(*)::int`,
  }).from(schema.crimeIncidents)
    .where(and(base, sql`${schema.crimeIncidents.reportedAt} >= ${tsPrev} and ${schema.crimeIncidents.reportedAt} < ${tsEnd}`))
    .groupBy(schema.crimeIncidents.category, schema.crimeIncidents.nonCriminal, sql`3`); // positional: the CASE carries bind params, which Postgres cannot match textually in GROUP BY

  const cat = new Map<CrimeCategory, { count: number; previous: number }>();
  for (const c of CRIME_CATEGORIES) cat.set(c, { count: 0, previous: 0 });
  let total = 0, previousTotal = 0, nonCriminalExcluded = 0;
  for (const r of rows) {
    if (r.nonCriminal) { if (r.period === "current") nonCriminalExcluded += r.n; continue; }
    const c = (CRIME_CATEGORIES as readonly string[]).includes(r.category) ? (r.category as CrimeCategory) : "other_reported_incident";
    const e = cat.get(c)!;
    if (r.period === "current") { e.count += r.n; total += r.n; } else { e.previous += r.n; previousTotal += r.n; }
  }

  const recent = await db.select({
    id: schema.crimeIncidents.id, reportedAt: schema.crimeIncidents.reportedAt, category: schema.crimeIncidents.category,
    agencyClassification: schema.crimeIncidents.agencyClassification, locationText: schema.crimeIncidents.locationText,
    clearanceStatus: schema.crimeIncidents.clearanceStatus,
    distance: sql<number>`ST_Distance(${schema.crimeIncidents.point}, ${origin})`,
  }).from(schema.crimeIncidents)
    .where(and(base, eq(schema.crimeIncidents.nonCriminal, false), sql`${schema.crimeIncidents.reportedAt} >= ${tsCur} and ${schema.crimeIncidents.reportedAt} < ${tsEnd}`))
    .orderBy(sql`${schema.crimeIncidents.reportedAt} desc`).limit(25);

  return {
    sourceKey, radiusMiles: opts.radiusMiles, rangeDays: opts.rangeDays, radiusMeters,
    currentStart, currentEnd, previousStart, dataFrom, dataThrough, currentComplete, previousComplete,
    total, previousTotal, nonCriminalExcluded,
    categories: CRIME_CATEGORIES.map((c) => ({ category: c, label: CATEGORY_LABELS[c], ...cat.get(c)! })),
    trend: computeTrend({ count: total, complete: currentComplete }, { count: previousTotal, complete: previousComplete }),
    recent: recent.map((r) => ({
      id: r.id, reportedAt: r.reportedAt, agencyClassification: r.agencyClassification, locationText: r.locationText, clearanceStatus: r.clearanceStatus,
      category: (CRIME_CATEGORIES as readonly string[]).includes(r.category) ? (r.category as CrimeCategory) : "other_reported_incident",
      // Two decimals at most: source coordinates are block-masked, so finer distance would be false precision.
      distanceMiles: Math.round((Number(r.distance) / MILES_TO_METERS) * 100) / 100,
    })),
  };
}
