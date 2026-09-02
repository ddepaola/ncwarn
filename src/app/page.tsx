import { AddressForm } from "@/components/AddressForm";
import Link from "next/link";
import Image from "next/image";
import { publicImage } from "@/lib/images";

const PILLARS: Array<[string, string, string]> = [
  ["Safety", "pillar-safety.png", "Reported local crime activity, official registered-offender resources, emergency information, and public-safety notices."],
  ["Property", "pillar-property.png", "Flood exposure, environmental records, permits, tax changes, code matters, and other location-based public records."],
  ["Development", "pillar-development.png", "Rezonings, land-use cases, proposed construction, road projects, utilities, sewer expansion, and public hearings."],
  ["Government", "pillar-government.png", "Legislation, votes, campaign finance, contracts, public meetings, and decisions with geographic or financial impact."],
];

export default function Home() {
  const hero = publicImage("hero-nc-map.png");
  return (
    <div className="space-y-12">
      <section className={`pt-6 ${hero ? "grid lg:grid-cols-[3fr_2fr] gap-8 items-center" : ""}`}>
        <div>
          <p className="text-accent font-semibold uppercase tracking-wide text-sm">NCWarn.com</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-1">Know What’s Nearby. Know What’s Coming.</h1>
          <p className="text-lg text-muted mt-4 max-w-3xl">Check an address for reported crime activity, official registered-offender resources, development proposals, road projects, environmental records, and government decisions.</p>
          <div className="mt-6 max-w-3xl"><AddressForm /></div>
          <p className="text-sm text-muted mt-3">Launching first for <Link className="underline" href="/counties/union">Union</Link> and <Link className="underline" href="/counties/mecklenburg">Mecklenburg</Link> counties. Any North Carolina address resolves; coverage varies by county and is always shown.</p>
        </div>
        {hero && <Image src={hero} alt="" aria-hidden="true" width={1600} height={900} priority unoptimized className="hidden lg:block w-full h-auto rounded-lg" />}
      </section>
      <section aria-labelledby="pillars">
        <h2 id="pillars" className="text-2xl font-semibold mb-4">What every result answers</h2>
        <p className="text-muted mb-4">What happened or is proposed · Where it is · Who is responsible · Why it may matter to this address · Whether there is a deadline or hearing · The original authoritative source.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {PILLARS.map(([t, img, d]) => {
            const src = publicImage(img);
            return (
              <div key={t} className="bg-card border border-border rounded-lg p-4 flex gap-4 items-start">
                {src && <Image src={src} alt="" aria-hidden="true" width={512} height={512} unoptimized className="w-16 h-16 shrink-0 rounded" />}
                <div><h3 className="font-semibold">{t}</h3><p className="text-muted text-sm mt-1">{d}</p></div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
