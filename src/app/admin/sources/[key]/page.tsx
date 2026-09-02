import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { FRESHNESS_LABELS } from "@/modules/coverage/coverage";

export const metadata: Metadata = { title: "Admin · Source detail", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const fmt = (d: Date | null | undefined) => (d ? d.toISOString().replace("T", " ").slice(0, 16) : "—");

/** Per-source operator view: run history, quarantined records, suppressions (handoff §10 review tools). */
export default async function AdminSourceDetail({ params, searchParams }: PageProps<"/admin/sources/[key]">) {
  const { key } = await params;
  const { ok } = await searchParams;
  const [source] = await db.select().from(schema.sources).where(eq(schema.sources.key, key)).limit(1);
  if (!source) notFound();
  const runs = await db.select().from(schema.sourceRuns).where(eq(schema.sourceRuns.sourceId, source.id)).orderBy(desc(schema.sourceRuns.startedAt)).limit(25);
  const cov = await db.select().from(schema.coverageStatus).where(eq(schema.coverageStatus.sourceId, source.id));
  const quarantined = await db.select().from(schema.quarantinedRecords).where(eq(schema.quarantinedRecords.sourceId, source.id)).orderBy(desc(schema.quarantinedRecords.createdAt)).limit(50);
  const [qCounts] = await db.select({ total: sql<number>`count(*)::int`, unreviewed: sql<number>`count(*) filter (where reviewed_at is null)::int` }).from(schema.quarantinedRecords).where(eq(schema.quarantinedRecords.sourceId, source.id));
  const suppressions = await db.select().from(schema.suppressions).where(and(eq(schema.suppressions.sourceId, source.id), isNull(schema.suppressions.liftedAt))).orderBy(desc(schema.suppressions.createdAt));
  const [incidents] = source.key === "cmpd_incidents"
    ? await db.select({ n: sql<number>`count(*)::int`, min: sql<string>`min(reported_at)::date`, max: sql<string>`max(reported_at)::date` }).from(schema.crimeIncidents).where(eq(schema.crimeIncidents.sourceId, source.id))
    : [{ n: 0, min: null, max: null }];
  const input = "border border-border rounded px-2 py-1 text-sm";

  return (
    <div className="space-y-8">
      <p className="text-sm"><Link className="underline" href="/admin/sources">← Source health</Link></p>
      <div>
        <h1 className="text-2xl font-bold">{source.name}</h1>
        <p className="text-muted text-sm"><span className="font-mono">{source.key}</span> · {source.authority} · terms {source.termsStatus} · <a className="underline" href={source.url} rel="noopener">source</a></p>
        {typeof ok === "string" && <p role="status" className="mt-2 bg-card border border-border rounded p-2 text-sm">Done: {ok}.</p>}
      </div>

      <section className="grid sm:grid-cols-4 gap-3 text-sm">
        <div className="bg-card border border-border rounded p-3"><div className="text-muted">Stored records</div><div className="text-xl font-semibold">{incidents.n.toLocaleString()}</div><div className="text-xs text-muted">{incidents.min ?? "—"} → {incidents.max ?? "—"}</div></div>
        <div className="bg-card border border-border rounded p-3"><div className="text-muted">Coverage</div>{cov.map((c) => <div key={c.id}>{FRESHNESS_LABELS[c.state]}{c.sourceUpdatedAt ? ` · through ${c.sourceUpdatedAt.toISOString().slice(0, 10)}` : ""}</div>)}</div>
        <div className="bg-card border border-border rounded p-3"><div className="text-muted">Quarantined</div><div className="text-xl font-semibold">{qCounts?.total ?? 0}</div><div className="text-xs text-muted">{qCounts?.unreviewed ?? 0} unreviewed</div></div>
        <div className="bg-card border border-border rounded p-3"><div className="text-muted">Active suppressions</div><div className="text-xl font-semibold">{suppressions.length}</div></div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Run history (last 25)</h2>
        <div className="overflow-x-auto"><table className="w-full text-sm border-collapse">
          <thead><tr className="text-left border-b border-border"><th className="py-1 pr-3">Started</th><th className="py-1 pr-3">Ended</th><th className="py-1 pr-3">Outcome</th><th className="py-1 pr-3 text-right">Fetched</th><th className="py-1 pr-3 text-right">Rejected</th><th className="py-1 pr-3 text-right">Created</th><th className="py-1 pr-3 text-right">Updated</th><th className="py-1">Job / error</th></tr></thead>
          <tbody>{runs.map((r) => (
            <tr key={r.id} className="border-b border-border align-top"><td className="py-1 pr-3 whitespace-nowrap">{fmt(r.startedAt)}</td><td className="py-1 pr-3 whitespace-nowrap">{fmt(r.endedAt)}</td><td className="py-1 pr-3">{r.outcome ?? "running"}</td><td className="py-1 pr-3 text-right tabular-nums">{r.fetched}</td><td className="py-1 pr-3 text-right tabular-nums">{r.rejected}</td><td className="py-1 pr-3 text-right tabular-nums">{r.created}</td><td className="py-1 pr-3 text-right tabular-nums">{r.updated}</td><td className="py-1 font-mono text-xs">{r.jobId ?? ""}{r.error ? <span className="text-warn"> {r.error}</span> : null}</td></tr>
          ))}{runs.length === 0 && <tr><td colSpan={8} className="py-2 text-muted">No runs yet.</td></tr>}</tbody>
        </table></div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Suppressions</h2>
        <p className="text-sm text-muted mb-2">A suppressed record stays in the database but is excluded from every public count and list. Use for agency corrections or clear mis-geocodes; every change is audit-logged.</p>
        <form method="post" action={`/api/admin/sources/${source.key}/suppress`} className="flex flex-wrap items-end gap-2 mb-3">
          <label className="text-sm">Report # (external id)<input name="externalId" required maxLength={100} className={`block ${input} font-mono`} /></label>
          <label className="text-sm flex-1 min-w-64">Reason<input name="reason" required minLength={5} maxLength={500} className={`block w-full ${input}`} placeholder="e.g. agency marked unfounded on 2026-09-01; coordinates outside jurisdiction" /></label>
          <button type="submit" name="action" value="add" className="rounded bg-accent text-accent-ink px-3 py-1.5 text-sm font-semibold">Suppress</button>
        </form>
        <div className="overflow-x-auto"><table className="w-full text-sm border-collapse">
          <thead><tr className="text-left border-b border-border"><th className="py-1 pr-3">Report #</th><th className="py-1 pr-3">Reason</th><th className="py-1 pr-3">By</th><th className="py-1 pr-3">Since</th><th className="py-1"></th></tr></thead>
          <tbody>{suppressions.map((s) => (
            <tr key={s.id} className="border-b border-border align-top"><td className="py-1 pr-3 font-mono text-xs">{s.externalId}</td><td className="py-1 pr-3">{s.reason}</td><td className="py-1 pr-3">{s.actor}</td><td className="py-1 pr-3 whitespace-nowrap">{fmt(s.createdAt)}</td>
              <td className="py-1"><form method="post" action={`/api/admin/sources/${source.key}/suppress`}><input type="hidden" name="externalId" value={s.externalId} /><button name="action" value="lift" className="underline text-sm">Lift</button></form></td></tr>
          ))}{suppressions.length === 0 && <tr><td colSpan={5} className="py-2 text-muted">None active.</td></tr>}</tbody>
        </table></div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Quarantined records (latest 50)</h2>
        <p className="text-sm text-muted mb-2">Records that failed validation on import. They are never shown publicly. Review them to spot a parser problem (many rows with the same reason) versus genuine source noise.</p>
        <div className="overflow-x-auto"><table className="w-full text-sm border-collapse">
          <thead><tr className="text-left border-b border-border"><th className="py-1 pr-3">When</th><th className="py-1 pr-3">Report #</th><th className="py-1 pr-3">Reasons</th><th className="py-1 pr-3">Payload</th><th className="py-1">Review</th></tr></thead>
          <tbody>{quarantined.map((q) => (
            <tr key={q.id} className="border-b border-border align-top"><td className="py-1 pr-3 whitespace-nowrap">{fmt(q.createdAt)}</td><td className="py-1 pr-3 font-mono text-xs">{q.externalId ?? "(none)"}</td><td className="py-1 pr-3">{q.reasons.join("; ")}</td>
              <td className="py-1 pr-3"><details><summary className="cursor-pointer underline">show</summary><pre className="text-xs whitespace-pre-wrap max-w-md">{JSON.stringify(q.payload, null, 1)}</pre></details></td>
              <td className="py-1">{q.reviewedAt ? <span className="text-muted">reviewed {fmt(q.reviewedAt)}{q.reviewNote ? ` — ${q.reviewNote}` : ""}</span> : (
                <form method="post" action={`/api/admin/quarantine/${q.id}/review`} className="flex gap-1"><input name="note" maxLength={500} placeholder="note" className={input} /><button className="underline text-sm">Mark reviewed</button></form>)}</td></tr>
          ))}{quarantined.length === 0 && <tr><td colSpan={5} className="py-2 text-muted">Nothing quarantined.</td></tr>}</tbody>
        </table></div>
      </section>
    </div>
  );
}
