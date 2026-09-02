import { AddressForm } from "@/components/AddressForm";
import Link from "next/link";

const PILLARS = [
  ["Safety", "Reported local crime activity, official registered-offender resources, emergency information, and public-safety notices."],
  ["Property", "Flood exposure, environmental records, permits, tax changes, code matters, and other location-based public records."],
  ["Development", "Rezonings, land-use cases, proposed construction, road projects, utilities, sewer expansion, and public hearings."],
  ["Government", "Legislation, votes, campaign finance, contracts, public meetings, and decisions with geographic or financial impact."],
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="pt-6">
        <p className="text-accent font-semibold uppercase tracking-wide text-sm">NCWarn.com</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-1">Know What’s Nearby. Know What’s Coming.</h1>
        <p className="text-lg text-muted mt-4 max-w-3xl">Check an address for reported crime activity, official registered-offender resources, development proposals, road projects, environmental records, and government decisions.</p>
        <div className="mt-6 max-w-3xl"><AddressForm /></div>
        <p className="text-sm text-muted mt-3">Launching first for <Link className="underline" href="/counties/union">Union</Link> and <Link className="underline" href="/counties/mecklenburg">Mecklenburg</Link> counties. Any North Carolina address resolves; coverage varies by county and is always shown.</p>
      </section>
      <section aria-labelledby="pillars">
        <h2 id="pillars" className="text-2xl font-semibold mb-4">What every result answers</h2>
        <p className="text-muted mb-4">What happened or is proposed · Where it is · Who is responsible · Why it may matter to this address · Whether there is a deadline or hearing · The original authoritative source.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {PILLARS.map(([t, d]) => (
            <div key={t} className="bg-card border border-border rounded-lg p-4"><h3 className="font-semibold">{t}</h3><p className="text-muted text-sm mt-1">{d}</p></div>
          ))}
        </div>
      </section>
    </div>
  );
}
