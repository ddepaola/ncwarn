import { db, schema } from "@/lib/db";
import { eq, or, isNull, inArray } from "drizzle-orm";
import { MVP_COUNTIES } from "./jurisdiction";

export type FreshnessState = (typeof schema.freshnessEnum.enumValues)[number];

export interface SourceCoverage {
  key: string;
  name: string;
  authority: string;
  url: string;
  topic: string;
  accessType: string;
  termsStatus: string;
  coverageDescription: string | null;
  state: FreshnessState;
  lastSuccessAt: Date | null;
  sourceUpdatedAt: Date | null;
  note: string | null;
}

export const FRESHNESS_LABELS: Record<FreshnessState, string> = {
  current: "Current",
  delayed: "Delayed",
  stale: "Stale",
  temporarily_unavailable: "Temporarily unavailable",
  coverage_not_available: "Coverage not available",
  integration_pending: "Integration pending",
};

/** Coverage for a county: statewide sources + sources scoped to that county. Never represents unavailable as zero. */
export async function coverageForCounty(countyFips?: string): Promise<SourceCoverage[]> {
  const jurisdictionIds: string[] = [];
  if (countyFips) {
    const j = await db.select({ id: schema.jurisdictions.id }).from(schema.jurisdictions)
      .where(eq(schema.jurisdictions.countyFips, countyFips));
    jurisdictionIds.push(...j.map((x) => x.id));
  }
  const rows = await db
    .select({
      key: schema.sources.key, name: schema.sources.name, authority: schema.sources.authority, url: schema.sources.url,
      topic: schema.sources.topic, accessType: schema.sources.accessType, termsStatus: schema.sources.termsStatus,
      coverageDescription: schema.sources.coverageDescription,
      state: schema.coverageStatus.state, lastSuccessAt: schema.coverageStatus.lastSuccessAt,
      sourceUpdatedAt: schema.coverageStatus.sourceUpdatedAt, note: schema.coverageStatus.note,
      jurisdictionId: schema.coverageStatus.jurisdictionId,
    })
    .from(schema.coverageStatus)
    .innerJoin(schema.sources, eq(schema.sources.id, schema.coverageStatus.sourceId))
    .where(
      jurisdictionIds.length
        ? or(isNull(schema.coverageStatus.jurisdictionId), inArray(schema.coverageStatus.jurisdictionId, jurisdictionIds))
        : isNull(schema.coverageStatus.jurisdictionId),
    );
  // Prefer county-specific row over statewide row for the same source.
  const byKey = new Map<string, SourceCoverage>();
  for (const r of rows) {
    const existing = byKey.get(r.key);
    if (!existing || (r.jurisdictionId && !existing)) byKey.set(r.key, r);
    else if (r.jurisdictionId) byKey.set(r.key, r);
  }
  return [...byKey.values()].sort((a, b) => a.topic.localeCompare(b.topic) || a.name.localeCompare(b.name));
}

export async function allSourceCoverage(): Promise<SourceCoverage[]> {
  const rows = await db
    .select({
      key: schema.sources.key, name: schema.sources.name, authority: schema.sources.authority, url: schema.sources.url,
      topic: schema.sources.topic, accessType: schema.sources.accessType, termsStatus: schema.sources.termsStatus,
      coverageDescription: schema.sources.coverageDescription,
      state: schema.coverageStatus.state, lastSuccessAt: schema.coverageStatus.lastSuccessAt,
      sourceUpdatedAt: schema.coverageStatus.sourceUpdatedAt, note: schema.coverageStatus.note,
    })
    .from(schema.coverageStatus)
    .innerJoin(schema.sources, eq(schema.sources.id, schema.coverageStatus.sourceId))
    .where(isNull(schema.coverageStatus.jurisdictionId));
  return rows.sort((a, b) => a.topic.localeCompare(b.topic) || a.name.localeCompare(b.name));
}

export function mvpCountyList() {
  return Object.entries(MVP_COUNTIES).map(([fips, c]) => ({ fips, ...c }));
}
