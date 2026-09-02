import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MVP_COUNTIES } from "@/modules/coverage/jurisdiction";
import { coverageForCounty, FRESHNESS_LABELS } from "@/modules/coverage/coverage";
import { StatusBadge } from "@/components/Card";
import { AddressForm } from "@/components/AddressForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/counties/[countySlug]">): Promise<Metadata> {
  const { countySlug } = await params;
  const c = Object.values(MVP_COUNTIES).find((x) => x.slug === countySlug);
  return { title: c ? `${c.name} County coverage` : "County" };
}

export default async function CountyPage({ params }: PageProps<"/counties/[countySlug]">) {
  const { countySlug } = await params;
  const entry = Object.entries(MVP_COUNTIES).find(([, x]) => x.slug === countySlug);
  if (!entry) notFound();
  const [fips, c] = entry;
  const cov = await coverageForCounty(fips);
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">{c.name} County, North Carolina</h1>
      <p className="text-muted">Sources covering {c.name} County and their current freshness.</p>
      <ul className="divide-y divide-border bg-card border border-border rounded-lg px-4">
        {cov.map((s) => <li key={s.key} className="py-3 flex flex-wrap justify-between gap-2"><span><a className="underline" href={s.url}>{s.name}</a><div className="text-sm text-muted">{s.coverageDescription}</div></span><StatusBadge state={s.state} label={FRESHNESS_LABELS[s.state]} /></li>)}
      </ul>
      <div><h2 className="font-semibold mb-2">Check an address in {c.name} County</h2><AddressForm compact /></div>
    </div>
  );
}
