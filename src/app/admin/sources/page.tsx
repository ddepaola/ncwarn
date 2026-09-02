import type { Metadata } from "next";
import { db, schema } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { FRESHNESS_LABELS } from "@/modules/coverage/coverage";

export const metadata: Metadata = { title: "Admin · Source health", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const sources = await db.select().from(schema.sources).orderBy(schema.sources.topic, schema.sources.name);
  const traps = await db.select({ form: schema.botTraps.form, reason: schema.botTraps.reason, n: sql<number>`count(*)::int` }).from(schema.botTraps)
    .where(sql`${schema.botTraps.createdAt} > now() - interval '7 days'`).groupBy(schema.botTraps.form, schema.botTraps.reason);
  const [lookups] = await db.select({ total: sql<number>`count(*)::int`, ok: sql<number>`count(*) filter (where success)::int` }).from(schema.addressLookups).where(sql`${schema.addressLookups.createdAt} > now() - interval '7 days'`);
  const [signups] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.emailSignups);
  const rows = [];
  for (const s of sources) {
    const [run] = await db.select().from(schema.sourceRuns).where(eq(schema.sourceRuns.sourceId, s.id)).orderBy(desc(schema.sourceRuns.startedAt)).limit(1);
    const cov = await db.select().from(schema.coverageStatus).where(eq(schema.coverageStatus.sourceId, s.id));
    rows.push({ s, run, cov });
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Source health</h1>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div className="bg-card border border-border rounded p-3"><div className="text-muted">Lookups (7d)</div><div className="text-xl font-semibold">{lookups?.ok ?? 0} / {lookups?.total ?? 0} succeeded</div></div>
        <div className="bg-card border border-border rounded p-3"><div className="text-muted">Email signups (all time)</div><div className="text-xl font-semibold">{signups?.n ?? 0}</div></div>
        <div className="bg-card border border-border rounded p-3"><div className="text-muted">Bot traps (7d)</div><div className="text-xl font-semibold">{traps.reduce((a, t) => a + t.n, 0)}</div><div className="text-xs text-muted">{traps.map((t) => `${t.form}/${t.reason}: ${t.n}`).join(" · ") || "none"}</div></div>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm border-collapse">
        <thead><tr className="text-left border-b border-border"><th className="py-2 pr-3">Source</th><th className="py-2 pr-3">Terms</th><th className="py-2 pr-3">Active</th><th className="py-2 pr-3">Coverage state(s)</th><th className="py-2 pr-3">Last run</th><th className="py-2">Outcome / counts</th></tr></thead>
        <tbody>{rows.map(({ s, run, cov }) => (
          <tr key={s.id} className="border-b border-border align-top">
            <td className="py-2 pr-3"><div className="font-medium">{s.name}</div><div className="text-muted font-mono text-xs">{s.key}</div></td>
            <td className="py-2 pr-3">{s.termsStatus}</td><td className="py-2 pr-3">{s.active ? "yes" : "no"}</td>
            <td className="py-2 pr-3">{cov.map((c) => <div key={c.id}>{FRESHNESS_LABELS[c.state]}{c.note ? ` — ${c.note}` : ""}</div>)}</td>
            <td className="py-2 pr-3">{run ? run.startedAt.toISOString().replace("T", " ").slice(0, 16) : "never"}</td>
            <td className="py-2">{run ? `${run.outcome ?? "running"} · fetched ${run.fetched}, parsed ${run.parsed}, rejected ${run.rejected}, created ${run.created}, updated ${run.updated}${run.error ? ` · ${run.error}` : ""}` : "—"}</td>
          </tr>))}</tbody>
      </table></div>
      <p className="text-xs text-muted">Manual re-runs, quarantine review and suppression arrive with the ingestion milestone.</p>
    </div>
  );
}
