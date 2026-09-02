import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { enqueueSourceRun } from "@/lib/queue";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const RUNNABLE = new Set(["cmpd_incidents"]);

/** Manually enqueue a source import (protected by proxy.ts Basic auth). Body may include { since: ISO date }. */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/admin/sources/[key]/run">) {
  const { key } = await ctx.params;
  if (!RUNNABLE.has(key)) return NextResponse.json({ ok: false, message: "No importer for this source" }, { status: 404 });
  const [source] = await db.select({ id: schema.sources.id }).from(schema.sources).where(eq(schema.sources.key, key)).limit(1);
  if (!source) return NextResponse.json({ ok: false, message: "Unknown source" }, { status: 404 });
  let since: string | undefined;
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { since?: string };
    if (body.since && !Number.isNaN(Date.parse(body.since))) since = new Date(body.since).toISOString();
  } else if (ct.includes("form")) {
    const fd = await req.formData();
    const s = fd.get("since");
    if (typeof s === "string" && s && !Number.isNaN(Date.parse(s))) since = new Date(s).toISOString();
  }
  const job = await enqueueSourceRun(key, { since, actor: "admin" });
  await db.insert(schema.auditLog).values({ actor: "admin", action: "source.run.enqueue", target: `${key}:${job.id}${since ? `:since=${since}` : ""}` });
  logger.info({ key, jobId: job.id, since }, "source run enqueued by admin");
  if (ct.includes("form")) return NextResponse.redirect(new URL("/admin/sources?enqueued=" + encodeURIComponent(key), req.url), 303);
  return NextResponse.json({ ok: true, jobId: job.id, since: since ?? null });
}
