import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Mark a quarantined record as reviewed with a note (it stays quarantined; re-import may replace it). */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/admin/quarantine/[id]/review">) {
  const { id } = await ctx.params;
  const fd = await req.formData();
  const note = String(fd.get("note") ?? "").trim().slice(0, 500);
  const [row] = await db.update(schema.quarantinedRecords).set({ reviewedAt: new Date(), reviewNote: note || null })
    .where(eq(schema.quarantinedRecords.id, id)).returning({ id: schema.quarantinedRecords.id, sourceId: schema.quarantinedRecords.sourceId });
  if (!row) return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  const [src] = await db.select({ key: schema.sources.key }).from(schema.sources).where(eq(schema.sources.id, row.sourceId)).limit(1);
  await db.insert(schema.auditLog).values({ actor: "admin", action: "quarantine.review", target: id });
  return NextResponse.redirect(new URL(`/admin/sources/${src?.key ?? ""}?ok=reviewed`, req.url), 303);
}
