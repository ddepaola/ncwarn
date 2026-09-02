import type { Metadata } from "next";
import { allSourceCoverage, FRESHNESS_LABELS } from "@/modules/coverage/coverage";
import { StatusBadge } from "@/components/Card";

export const metadata: Metadata = { title: "Source catalog and freshness" };
export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const rows = await allSourceCoverage();
  return (
    <div className="prose-basic max-w-4xl">
      <h1 className="text-3xl font-bold">Source catalog</h1>
      <p>Every result on NC Risk Radar links back to an authoritative public source. This page lists each source, how we access it, whether reuse terms have been reviewed, and its current freshness state. Terms are reviewed and recorded before any automated import is built.</p>
      <div className="overflow-x-auto mt-6"><table className="w-full text-sm border-collapse">
        <thead><tr className="text-left border-b border-border"><th className="py-2 pr-3">Source</th><th className="py-2 pr-3">Topic</th><th className="py-2 pr-3">Access</th><th className="py-2 pr-3">Terms</th><th className="py-2 pr-3">Freshness</th><th className="py-2">Last import</th></tr></thead>
        <tbody>{rows.map((s) => (
          <tr key={s.key} className="border-b border-border align-top">
            <td className="py-2 pr-3"><a className="underline" href={s.url} rel="noopener">{s.name}</a><div className="text-muted">{s.authority}</div><div className="text-muted">{s.coverageDescription}</div></td>
            <td className="py-2 pr-3">{s.topic}</td><td className="py-2 pr-3">{s.accessType.replace(/_/g, " ")}</td><td className="py-2 pr-3">{s.termsStatus.replace(/_/g, " ")}</td>
            <td className="py-2 pr-3"><StatusBadge state={s.state} label={FRESHNESS_LABELS[s.state]} /></td>
            <td className="py-2">{s.lastSuccessAt ? s.lastSuccessAt.toISOString().slice(0, 10) : "—"}</td>
          </tr>))}</tbody>
      </table></div>
      <h2>Freshness states</h2>
      <ul>{Object.entries(FRESHNESS_LABELS).map(([k, v]) => <li key={k}><strong>{v}</strong> — {STATE_HELP[k]}</li>)}</ul>
    </div>
  );
}

const STATE_HELP: Record<string, string> = {
  current: "the last import succeeded within the source's expected update interval.",
  delayed: "the last import succeeded but the source has not published new data within its expected interval.",
  stale: "no successful import for more than twice the expected interval; results may be out of date.",
  temporarily_unavailable: "recent imports failed; we show this state rather than zero results.",
  coverage_not_available: "the agency does not provide a reusable feed for this area; we link to its own tool.",
  integration_pending: "the source is catalogued and terms are under review; automated import is not live.",
};
