import { db, schema, sqlClient } from "../src/lib/db";
import { SOURCE_CATALOG } from "../src/modules/sources/catalog";
import { MVP_COUNTIES } from "../src/modules/coverage/jurisdiction";
import { eq, and, isNull } from "drizzle-orm";

/** Idempotent seed: jurisdictions (state + MVP counties), source catalog, coverage rows. Safe to re-run. */
async function main() {
  const [nc] = await db.insert(schema.jurisdictions).values({ kind: "state", name: "North Carolina", slug: "north-carolina", stateCode: "NC", mvpCoverage: true })
    .onConflictDoUpdate({ target: [schema.jurisdictions.kind, schema.jurisdictions.slug], set: { name: "North Carolina" } }).returning();
  const countyIds: Record<string, string> = {};
  for (const [fips, c] of Object.entries(MVP_COUNTIES)) {
    const [row] = await db.insert(schema.jurisdictions).values({ kind: "county", name: `${c.name} County`, slug: c.slug, stateCode: "NC", countyFips: fips, parentId: nc.id, mvpCoverage: true })
      .onConflictDoUpdate({ target: [schema.jurisdictions.kind, schema.jurisdictions.slug], set: { countyFips: fips, mvpCoverage: true } }).returning();
    countyIds[fips] = row.id;
  }
  for (const s of SOURCE_CATALOG) {
    const [src] = await db.insert(schema.sources).values({
      key: s.key, name: s.name, authority: s.authority, url: s.url, topic: s.topic, accessType: s.accessType, termsStatus: s.termsStatus,
      coverageDescription: s.coverageDescription, expectedIntervalMinutes: s.expectedIntervalMinutes ?? null, active: true,
    }).onConflictDoUpdate({ target: schema.sources.key, set: { name: s.name, authority: s.authority, url: s.url, topic: s.topic, accessType: s.accessType, coverageDescription: s.coverageDescription, updatedAt: new Date() } }).returning();
    // statewide row (jurisdiction NULL) always exists so /sources can list it
    const existing = await db.select({ id: schema.coverageStatus.id }).from(schema.coverageStatus).where(and(eq(schema.coverageStatus.sourceId, src.id), isNull(schema.coverageStatus.jurisdictionId)));
    if (existing.length === 0) await db.insert(schema.coverageStatus).values({ sourceId: src.id, jurisdictionId: null, state: s.initialState, lastSuccessAt: s.initialState === "current" ? new Date() : null });
    for (const fips of s.countyFips ?? []) {
      const jid = countyIds[fips]; if (!jid) continue;
      await db.insert(schema.coverageStatus).values({ sourceId: src.id, jurisdictionId: jid, state: s.initialState }).onConflictDoNothing();
    }
  }
  console.log(JSON.stringify({ level: "info", msg: "seed complete", sources: SOURCE_CATALOG.length }));
  await sqlClient.end();
}
main().catch((err) => { console.error(err); process.exit(1); });
