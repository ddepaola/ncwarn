import { createHash } from "node:crypto";
import { db, schema } from "@/lib/db";
import { and, eq, isNull, sql, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { cmpdAdapter, cmpdContentHash, type CmpdAttributes } from "./cmpd";
import { categoryForNibrs } from "@/modules/crime/nibrs";

/**
 * Ingestion pipeline (handoff §10): fetch → preserve evidence → parse → validate →
 * normalize → dedupe/upsert → update coverage & run bookkeeping. Restartable and
 * idempotent: re-running a window never duplicates incidents (unique source+external id,
 * content-hash change detection).
 */
export const BACKFILL_DAYS = 760; // ~25 months: 365-day window + its preceding equivalent period, plus slack
export const OVERLAP_DAYS = 7;    // re-scan recent days each run to pick up late edits/clearance changes
const CHUNK = 500;

export interface RunResult { runId: string; outcome: "success" | "partial" | "failed"; fetched: number; parsed: number; rejected: number; created: number; updated: number; error?: string }

export async function runCmpdIngest(opts: { since?: Date; jobId?: string; signal?: AbortSignal } = {}): Promise<RunResult> {
  const [source] = await db.select().from(schema.sources).where(eq(schema.sources.key, "cmpd_incidents")).limit(1);
  if (!source) throw new Error("source cmpd_incidents not seeded");
  const [run] = await db.insert(schema.sourceRuns).values({ sourceId: source.id, parserVersion: cmpdAdapter.parserVersion, jobId: opts.jobId ?? null }).returning();
  const log = logger.child({ source: source.key, runId: run.id });
  const counts = { fetched: 0, parsed: 0, rejected: 0, created: 0, updated: 0 };
  try {
    // Window: explicit since, else last successful import minus overlap, else backfill.
    const [cov] = await db.select().from(schema.coverageStatus).where(and(eq(schema.coverageStatus.sourceId, source.id), isNull(schema.coverageStatus.jurisdictionId))).limit(1);
    const [latest] = await db.select({ m: sql<Date | null>`max(${schema.crimeIncidents.reportedAt})` }).from(schema.crimeIncidents).where(eq(schema.crimeIncidents.sourceId, source.id));
    const now = new Date();
    const since = opts.since ?? (latest?.m ? new Date(new Date(latest.m).getTime() - OVERLAP_DAYS * 86400000) : new Date(now.getTime() - BACKFILL_DAYS * 86400000));
    log.info({ since, backfill: !latest?.m }, "cmpd ingest window");

    // Fetch in month-sized slices so a single slice never exceeds pagination sanity limits.
    let maxReported: Date | null = latest?.m ? new Date(latest.m) : null;
    for (let s = new Date(since); s < now; ) {
      const e = new Date(Math.min(now.getTime(), s.getTime() + 31 * 86400000));
      const artifacts = await cmpdAdapter.fetchWindow(s, e, opts.signal);
      for (const art of artifacts) {
        const recs = await cmpdAdapter.parse(art);
        counts.fetched += recs.length;
        const rows: Array<typeof schema.crimeIncidents.$inferInsert> = [];
        const quarantine: Array<typeof schema.quarantinedRecords.$inferInsert> = [];
        for (const rec of recs) {
          const v = cmpdAdapter.validate(rec);
          if (!v.ok) { counts.rejected++; quarantine.push({ sourceId: source.id, runId: run.id, externalId: rec.externalId || null, reasons: v.reasons, payload: rec.fields }); continue; }
          const a = rec.fields as unknown as CmpdAttributes;
          const { category, nonCriminal } = categoryForNibrs(a.HIGHEST_NIBRS_CODE);
          const hasPoint = typeof a.LATITUDE_PUBLIC === "number" && typeof a.LONGITUDE_PUBLIC === "number" && a.LATITUDE_PUBLIC !== 0;
          const reportedAt = new Date(a.DATE_REPORTED as number);
          if (!maxReported || reportedAt > maxReported) maxReported = reportedAt;
          rows.push({
            sourceId: source.id, externalId: rec.externalId, agencyCode: a.HIGHEST_NIBRS_CODE ?? null,
            agencyClassification: a.HIGHEST_NIBRS_DESCRIPTION ?? (a.HIGHEST_NIBRS_CODE ?? "Unclassified"),
            category, nonCriminal, reportedAt, incidentBeganAt: a.DATE_INCIDENT_BEGAN ? new Date(a.DATE_INCIDENT_BEGAN) : null,
            locationText: a.LOCATION ?? null, city: a.CITY ?? null, zip: a.ZIP ?? null,
            point: hasPoint ? { lng: a.LONGITUDE_PUBLIC as number, lat: a.LATITUDE_PUBLIC as number } : null,
            precision: hasPoint ? "block" : "jurisdiction_only",
            clearanceStatus: a.CLEARANCE_STATUS ?? null, locationType: a.LOCATION_TYPE_DESCRIPTION ?? null, patrolDivision: a.CMPD_PATROL_DIVISION ?? null,
            contentHash: cmpdContentHash(a), sourceUrl: rec.sourceUrl, fetchedAt: rec.fetchedAt, parserVersion: cmpdAdapter.parserVersion,
          });
          counts.parsed++;
        }
        for (let i = 0; i < rows.length; i += CHUNK) {
          const chunk = rows.slice(i, i + CHUNK);
          const res = await db.insert(schema.crimeIncidents).values(chunk)
            .onConflictDoUpdate({
              target: [schema.crimeIncidents.sourceId, schema.crimeIncidents.externalId],
              set: {
                agencyCode: sql`excluded.agency_code`, agencyClassification: sql`excluded.agency_classification`, category: sql`excluded.category`,
                nonCriminal: sql`excluded.non_criminal`, reportedAt: sql`excluded.reported_at`, incidentBeganAt: sql`excluded.incident_began_at`,
                locationText: sql`excluded.location_text`, city: sql`excluded.city`, zip: sql`excluded.zip`, point: sql`excluded.point`, precision: sql`excluded.precision`,
                clearanceStatus: sql`excluded.clearance_status`, locationType: sql`excluded.location_type`, patrolDivision: sql`excluded.patrol_division`,
                contentHash: sql`excluded.content_hash`, fetchedAt: sql`excluded.fetched_at`, parserVersion: sql`excluded.parser_version`, updatedAt: sql`now()`,
              },
              setWhere: sql`${schema.crimeIncidents.contentHash} <> excluded.content_hash`,
            })
            .returning({ created: sql<boolean>`(xmax = 0)` });
          const created = res.filter((r) => r.created).length;
          counts.created += created; counts.updated += res.length - created;
        }
        if (quarantine.length) await db.insert(schema.quarantinedRecords).values(quarantine.slice(0, 500));
        // Evidence: keep the fetched page as a raw record (one per page, hashed) — handoff §10 "preserve evidence".
        await db.insert(schema.rawRecords).values({
          sourceId: source.id, externalId: `page:${art.meta?.offset ?? 0}:${s.toISOString().slice(0, 10)}`, sourceUrl: art.sourceUrl, fetchedAt: art.fetchedAt,
          contentHash: sqlHash(art.body as string), payload: { count: recs.length, offset: art.meta?.offset ?? 0, window: [s.toISOString(), e.toISOString()] }, retentionClass: "page-index",
        }).onConflictDoNothing();
      }
      s = e;
    }

    await db.update(schema.sourceRuns).set({ endedAt: new Date(), outcome: "success", ...counts }).where(eq(schema.sourceRuns.id, run.id));
    const coverageSet = { state: "current" as const, lastSuccessAt: new Date(), lastAttemptAt: new Date(), sourceUpdatedAt: maxReported, note: null, updatedAt: new Date() };
    if (cov) await db.update(schema.coverageStatus).set(coverageSet).where(eq(schema.coverageStatus.id, cov.id));
    await db.update(schema.coverageStatus).set(coverageSet).where(and(eq(schema.coverageStatus.sourceId, source.id), sql`${schema.coverageStatus.jurisdictionId} is not null`));
    log.info(counts, "cmpd ingest complete");
    return { runId: run.id, outcome: "success", ...counts };
  } catch (err) {
    const message = (err as Error).message;
    log.error({ err: message, ...counts }, "cmpd ingest failed");
    await db.update(schema.sourceRuns).set({ endedAt: new Date(), outcome: counts.created + counts.updated > 0 ? "partial" : "failed", error: message.slice(0, 500), ...counts }).where(eq(schema.sourceRuns.id, run.id));
    // Source unreachable → say so; never pretend zero incidents.
    await db.update(schema.coverageStatus).set({ state: "temporarily_unavailable", lastAttemptAt: new Date(), note: message.slice(0, 200), updatedAt: new Date() })
      .where(and(eq(schema.coverageStatus.sourceId, source.id), sql`${schema.coverageStatus.lastSuccessAt} is null or ${schema.coverageStatus.lastSuccessAt} < now() - interval '3 days'`));
    return { runId: run.id, outcome: "failed", ...counts, error: message };
  }
}

function sqlHash(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 32);
}

/** Latest run for the admin UI. */
export async function latestRun(sourceKey: string) {
  const [source] = await db.select({ id: schema.sources.id }).from(schema.sources).where(eq(schema.sources.key, sourceKey)).limit(1);
  if (!source) return null;
  const [run] = await db.select().from(schema.sourceRuns).where(eq(schema.sourceRuns.sourceId, source.id)).orderBy(desc(schema.sourceRuns.startedAt)).limit(1);
  return run ?? null;
}
