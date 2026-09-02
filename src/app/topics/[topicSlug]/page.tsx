import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allSourceCoverage, FRESHNESS_LABELS } from "@/modules/coverage/coverage";
import { StatusBadge } from "@/components/Card";

const TOPICS: Record<string, { title: string; blurb: string }> = {
  crime: { title: "Reported crime activity", blurb: "Reported incidents from authorized agency sources, normalized into consistent categories with the original classification preserved." },
  registry: { title: "Registered-offender resources", blurb: "Official NCSBI search and notification links. No mirrored records." },
  development: { title: "Development and land use", blurb: "Rezonings, planning cases, proposed construction and public hearings." },
  roads: { title: "Roads and transportation", blurb: "NCDOT planned and active projects." },
  environment: { title: "Environment", blurb: "NC DEQ permits, contaminated sites, hearings and comment deadlines." },
  flood: { title: "Flood", blurb: "FIMAN gauges and inundation mapping." },
  property: { title: "Property records", blurb: "Permits, tax changes, code matters and public notices." },
  government: { title: "Government", blurb: "Legislation, votes, campaign finance, contracts and public meetings." },
  layoffs: { title: "Layoffs and WARN notices", blurb: "Employer layoff and closure notices filed with NC Commerce." },
};
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: PageProps<"/topics/[topicSlug]">): Promise<Metadata> {
  const { topicSlug } = await params; return { title: TOPICS[topicSlug]?.title ?? "Topic" };
}
export default async function TopicPage({ params }: PageProps<"/topics/[topicSlug]">) {
  const { topicSlug } = await params;
  const t = TOPICS[topicSlug]; if (!t) notFound();
  const rows = (await allSourceCoverage()).filter((s) => s.topic === topicSlug);
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold">{t.title}</h1><p className="text-muted">{t.blurb}</p>
      <h2 className="font-semibold">Sources</h2>
      <ul className="divide-y divide-border bg-card border border-border rounded-lg px-4">{rows.map((s) => <li key={s.key} className="py-3 flex justify-between gap-2"><a className="underline" href={s.url}>{s.name}</a><StatusBadge state={s.state} label={FRESHNESS_LABELS[s.state]} /></li>)}</ul>
      <p className="text-sm text-muted">Recent public events for this topic will appear here once sources are integrated.</p>
    </div>
  );
}
