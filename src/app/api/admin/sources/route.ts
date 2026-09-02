import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Admin source-health JSON (protected by proxy.ts). */
export async function GET() {
  const sources = await db.select().from(schema.sources).orderBy(schema.sources.topic, schema.sources.name);
  const out = [];
  for (const s of sources) {
    const [lastRun] = await db.select().from(schema.sourceRuns).where(eq(schema.sourceRuns.sourceId, s.id)).orderBy(desc(schema.sourceRuns.startedAt)).limit(1);
    const cov = await db.select().from(schema.coverageStatus).where(eq(schema.coverageStatus.sourceId, s.id));
    out.push({ ...s, lastRun: lastRun ?? null, coverage: cov });
  }
  return NextResponse.json({ sources: out });
}
