import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** Add or lift a suppression for one source record (form post from the admin page). Audit-logged. */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/admin/sources/[key]/suppress">) {
  const { key } = await ctx.params;
  const [source] = await db.select({ id: schema.sources.id }).from(schema.sources).where(eq(schema.sources.key, key)).limit(1);
  if (!source) return NextResponse.json({ ok: false, message: "Unknown source" }, { status: 404 });
  const fd = await req.formData();
  const externalId = String(fd.get("externalId") ?? "").trim();
  const reason = String(fd.get("reason") ?? "").trim();
  const action = fd.get("action") === "lift" ? "lift" : "add";
  if (!externalId || externalId.length > 100) return NextResponse.json({ ok: false, message: "externalId required" }, { status: 400 });
  if (action === "add") {
    if (reason.length < 5 || reason.length > 500) return NextResponse.json({ ok: false, message: "reason (5–500 chars) required" }, { status: 400 });
    const existing = await db.select({ id: schema.suppressions.id }).from(schema.suppressions)
      .where(and(eq(schema.suppressions.sourceId, source.id), eq(schema.suppressions.externalId, externalId), isNull(schema.suppressions.liftedAt))).limit(1);
    if (!existing.length) await db.insert(schema.suppressions).values({ sourceId: source.id, externalId, reason, actor: "admin" });
  } else {
    await db.update(schema.suppressions).set({ liftedAt: new Date() })
      .where(and(eq(schema.suppressions.sourceId, source.id), eq(schema.suppressions.externalId, externalId), isNull(schema.suppressions.liftedAt)));
  }
  await db.insert(schema.auditLog).values({ actor: "admin", action: `suppression.${action}`, target: `${key}:${externalId}` });
  logger.info({ key, externalId, action }, "suppression changed");
  return NextResponse.redirect(new URL(`/admin/sources/${key}?ok=${action}`, req.url), 303);
}
