import Link from "next/link";
import { Card, StatusBadge } from "@/components/Card";
import { FRESHNESS_LABELS, type SourceCoverage } from "@/modules/coverage/coverage";
import { RADIUS_MILES, TIME_RANGES_DAYS } from "@/modules/crime/trend";
import type { CrimeStats } from "@/modules/crime/queries";

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
// CMPD publishes report dates at day precision (local midnight); never display a fabricated time of day.
const fmtLocalDate = (d: Date) => d.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" });

/**
 * "Reported Crime Activity Near This Property" (handoff §7.2). No safety score, no
 * cross-neighborhood comparison; trend only against the address's own preceding period.
 */
export function CrimeCard({ sources, stats, lookupId, radius, range, nonCmpdMunicipality, view }: {
  sources: SourceCoverage[]; stats: CrimeStats | null; lookupId: string; radius: number; range: number; nonCmpdMunicipality: string | null; view: "summary" | "list";
}) {
  const href = (r: number, d: number, v: "summary" | "list") => `/check?lookup=${encodeURIComponent(lookupId)}&radius=${r}&range=${d}${v === "list" ? "&view=list" : ""}#crime`;
  const src = sources.find((s) => s.key === (stats?.sourceKey ?? "cmpd_incidents")) ?? sources[0];

  return (
    <Card id="crime" title="Reported Crime Activity Near This Property" topic="Safety"
      footer={src && <>Source: <a className="underline" href={src.url} rel="noopener">{src.name}</a> — {src.authority}. Reported incidents, not convictions; locations are published at block level by the agency, so distances are approximate. <Link className="underline" href="/methodology#crime">Methodology</Link>.</>}>
      {sources.length === 0 && <p>No crime data source is integrated for this county yet.</p>}

      {nonCmpdMunicipality && (
        <p className="bg-card border border-border rounded p-3 text-sm"><strong>Coverage not available for {nonCmpdMunicipality}.</strong> This town is policed by its own department, not CMPD, so CMPD’s open-data feed does not include it. Counts below would be misleading and are not shown. Check the town police department’s own reports instead.</p>
      )}

      {!nonCmpdMunicipality && sources.map((s) => {
        const isStatsSource = stats?.sourceKey === s.key;
        return (
          <div key={s.key} className="text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-medium">{s.name}</span>
            <StatusBadge state={s.state} label={FRESHNESS_LABELS[s.state]} />
            {isStatsSource && stats?.dataThrough && <span className="text-muted">data through {fmtDate(stats.dataThrough)}</span>}
            {isStatsSource && s.lastSuccessAt && <span className="text-muted">· imported {fmtDate(s.lastSuccessAt)}</span>}
            {!isStatsSource && s.state === "integration_pending" && <span className="text-muted">Automated import not live yet · <a className="underline" href={s.url} rel="noopener">official source</a></span>}
            {!isStatsSource && s.state === "temporarily_unavailable" && <span className="text-muted">Source unreachable recently; counts withheld rather than shown as zero · <a className="underline" href={s.url} rel="noopener">official source</a></span>}
            {!isStatsSource && s.state === "coverage_not_available" && <span className="text-muted">No reusable feed · <a className="underline" href={s.url} rel="noopener">agency crime map</a></span>}
          </div>
        );
      })}

      {!nonCmpdMunicipality && stats && (
        <>
          <nav aria-label="Radius and time range" className="flex flex-wrap gap-4 text-sm">
            <span>Radius: {RADIUS_MILES.map((r) => r === radius ? <strong key={r} aria-current="true" className="mx-1">{r} mi</strong> : <Link key={r} className="underline mx-1" href={href(r, range, view)}>{r} mi</Link>)}</span>
            <span>Period: {TIME_RANGES_DAYS.map((d) => d === range ? <strong key={d} aria-current="true" className="mx-1">{d} days</strong> : <Link key={d} className="underline mx-1" href={href(radius, d, view)}>{d} days</Link>)}</span>
            <span>View: {view === "summary" ? <strong aria-current="true">summary</strong> : <Link className="underline" href={href(radius, range, "summary")}>summary</Link>} · {view === "list" ? <strong aria-current="true">recent incidents</strong> : <Link className="underline" href={href(radius, range, "list")}>recent incidents</Link>}</span>
          </nav>

          <p className="text-xl font-semibold">{stats.total.toLocaleString()} reported incident{stats.total === 1 ? "" : "s"} <span className="text-base font-normal text-muted">within {radius} mi, {fmtDate(stats.currentStart)} – {fmtDate(new Date(stats.currentEnd.getTime() - 1))}</span></p>
          <p className="text-sm">
            {stats.trend.kind === "change" && <>Compared with this address’s own preceding {range} days ({stats.trend.previous.toLocaleString()} incidents): <strong>{stats.trend.direction === "up" ? "up" : "down"} {stats.trend.percent}%</strong>.</>}
            {stats.trend.kind === "flat" && <>Unchanged from this address’s own preceding {range} days ({stats.previousTotal.toLocaleString()} incidents).</>}
            {stats.trend.kind === "unavailable" && stats.trend.reason === "incomplete_coverage" && <>Trend not shown: imported history does not yet cover the full comparison period{stats.dataFrom ? ` (data begins ${fmtDate(stats.dataFrom)})` : ""}.</>}
            {stats.trend.kind === "unavailable" && stats.trend.reason === "no_baseline" && <>Trend not shown: no incidents were reported in the preceding {range} days, so a percentage would be meaningless.</>}
          </p>

          {view === "summary" ? (
            <div className="overflow-x-auto"><table className="w-full text-sm border-collapse">
              <caption className="sr-only">Reported incidents by category within {radius} miles, current period and the preceding equal period</caption>
              <thead><tr className="text-left border-b border-border"><th scope="col" className="py-1 pr-3">Category</th><th scope="col" className="py-1 pr-3 text-right">Last {range} days</th><th scope="col" className="py-1 text-right">Preceding {range} days{!stats.previousComplete && " *"}</th></tr></thead>
              <tbody>{stats.categories.map((c) => (
                <tr key={c.category} className="border-b border-border"><th scope="row" className="py-1 pr-3 font-normal">{c.label}</th><td className="py-1 pr-3 text-right tabular-nums">{c.count.toLocaleString()}</td><td className="py-1 text-right tabular-nums text-muted">{stats.previousComplete ? c.previous.toLocaleString() : "—"}</td></tr>
              ))}</tbody>
              <tfoot><tr className="font-semibold"><th scope="row" className="py-1 pr-3">Total</th><td className="py-1 pr-3 text-right tabular-nums">{stats.total.toLocaleString()}</td><td className="py-1 text-right tabular-nums">{stats.previousComplete ? stats.previousTotal.toLocaleString() : "—"}</td></tr></tfoot>
            </table>{!stats.previousComplete && <p className="text-xs text-muted">* Preceding period not shown because imported history does not cover it in full.</p>}</div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm border-collapse">
              <caption className="sr-only">Most recent reported incidents within {radius} miles (up to 25)</caption>
              <thead><tr className="text-left border-b border-border"><th scope="col" className="py-1 pr-3">Reported</th><th scope="col" className="py-1 pr-3">Agency classification</th><th scope="col" className="py-1 pr-3">Category</th><th scope="col" className="py-1 pr-3">Block</th><th scope="col" className="py-1 pr-3 text-right">≈ mi</th><th scope="col" className="py-1 pr-3">Status</th><th scope="col" className="py-1">Report #</th></tr></thead>
              <tbody>{stats.recent.map((r) => (
                <tr key={r.id} className="border-b border-border align-top"><td className="py-1 pr-3 whitespace-nowrap">{fmtLocalDate(r.reportedAt)}</td><td className="py-1 pr-3">{r.agencyClassification}</td><td className="py-1 pr-3">{stats.categories.find((c) => c.category === r.category)?.label}</td><td className="py-1 pr-3">{r.locationText ?? "—"}</td><td className="py-1 pr-3 text-right tabular-nums">{r.distanceMiles.toFixed(2)}</td><td className="py-1 pr-3">{r.clearanceStatus ?? "—"}</td><td className="py-1 font-mono text-xs text-muted">{r.externalId}</td></tr>
              ))}{stats.recent.length === 0 && <tr><td colSpan={7} className="py-2 text-muted">No reported incidents in this radius and period.</td></tr>}</tbody>
            </table><p className="text-xs text-muted">Showing the {Math.min(25, stats.recent.length)} most recent of {stats.total.toLocaleString()}. Locations are published by the agency at the hundred-block level (e.g. “4900 CENTRAL AV” means the 4900 block), never the exact address.</p></div>
          )}

          <p className="text-xs text-muted">
            {stats.nonCriminalExcluded > 0 && <>{stats.nonCriminalExcluded.toLocaleString()} non-criminal report{stats.nonCriminalExcluded === 1 ? "" : "s"} (e.g. missing persons, sudden deaths, found property) in this radius and period are excluded from counts. </>}
            Categories follow the agency’s NIBRS classification; ambiguous reports are counted as “other”, never escalated. We never publish a neighborhood “safety score”.
          </p>
        </>
      )}
    </Card>
  );
}
