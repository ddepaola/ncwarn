import type { Metadata } from "next";
import Link from "next/link";
import { AddressForm } from "@/components/AddressForm";
import { Card, StatusBadge } from "@/components/Card";
import { SignupForm } from "@/components/SignupForm";
import { getLookup } from "@/modules/address/lookups";
import { coverageForCounty, FRESHNESS_LABELS } from "@/modules/coverage/coverage";
import { REGISTRY_CARD } from "@/modules/registry/officialLinks";
import { issueFormToken } from "@/modules/notifications/honeypot";
import { MVP_COUNTIES } from "@/modules/coverage/jurisdiction";

export const metadata: Metadata = { title: "Check an address", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckPage({ searchParams }: PageProps<"/check">) {
  const { lookup } = await searchParams;
  const lookupId = typeof lookup === "string" ? lookup : undefined;
  const row = lookupId ? await getLookup(lookupId) : null;

  if (!row || !row.success) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-3xl font-bold">Check an address</h1>
        {row && !row.success && <p role="alert" className="text-warn">We couldn’t use that lookup ({row.failureReason}). Try again below.</p>}
        <AddressForm />
      </div>
    );
  }

  const county = row.countyFips ? MVP_COUNTIES[row.countyFips] : undefined;
  const coverage = await coverageForCounty(row.countyFips ?? undefined);
  const crimeSources = coverage.filter((s) => s.topic === "crime");
  const otherSources = coverage.filter((s) => s.topic !== "crime" && s.topic !== "registry");
  const token = issueFormToken();
  const fetchedAt = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">Free preview</p>
        <h1 className="text-2xl sm:text-3xl font-bold">{row.normalizedAddress}</h1>
        <p className="text-muted mt-1">
          {row.municipality ? `${row.municipality}, ` : "Unincorporated area, "}{county ? `${county.name} County` : `County FIPS ${row.countyFips ?? "unknown"}`}, North Carolina
          {row.geocoder && <> · geocoded by {row.geocoder} (confidence {Math.round((row.geocoderConfidence ?? 0) * 100)}%)</>}
        </p>
        {!county && <p className="mt-2 text-sm bg-card border border-border rounded p-3">This address is outside our initial launch counties (Union and Mecklenburg). We show statewide sources and official links; local integrations for this county are not yet available.</p>}
      </div>

      <Card id="coverage" title="Data coverage and freshness for this address" topic="Coverage">
        <p className="text-muted">Which sources cover this location and when each was last updated. “Coverage unavailable” is never shown as zero results.</p>
        <ul className="divide-y divide-border">
          {coverage.map((s) => (
            <li key={s.key} className="py-2 flex flex-wrap justify-between gap-2">
              <span><a href={s.url} className="underline" rel="noopener">{s.name}</a> <span className="text-muted text-sm">— {s.authority}</span></span>
              <span className="text-sm"><StatusBadge state={s.state} label={FRESHNESS_LABELS[s.state]} />{s.lastSuccessAt && <span className="text-muted"> · imported {s.lastSuccessAt.toISOString().slice(0, 10)}</span>}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card id="registry" title={REGISTRY_CARD.title} topic="Safety" footer={<>Source: <a className="underline" href={REGISTRY_CARD.searchUrl}>{REGISTRY_CARD.authority}</a> · official site checked live by you · {REGISTRY_CARD.misuseWarning}</>}>
        <p>{REGISTRY_CARD.explanation}</p>
        <ul className="list-disc pl-5">
          <li><a className="underline" href={REGISTRY_CARD.searchUrl} rel="noopener">Search the official NC registry</a> (opens NCSBI)</li>
          <li><a className="underline" href={REGISTRY_CARD.emailAlertsUrl} rel="noopener">Sign up for official NCSBI email notifications</a> — {REGISTRY_CARD.alertsNote}</li>
          <li><a className="underline" href={REGISTRY_CARD.phoneAlertsUrl} rel="noopener">Telephone alerts</a> · <a className="underline" href={REGISTRY_CARD.faqUrl} rel="noopener">Registry FAQ</a></li>
        </ul>
        <p className="text-sm text-muted"><strong>Why this may matter:</strong> registry proximity is a common due-diligence check for homebuyers and families. We do not store or republish registrant records; use the official source for current information.</p>
      </Card>

      <Card id="crime" title="Reported Crime Activity Near This Property" topic="Safety">
        {crimeSources.length === 0 && <p>No crime data source is integrated for this county yet.</p>}
        {crimeSources.map((s) => (
          <div key={s.key} className="border border-border rounded p-3">
            <p className="font-medium">{s.name} <span className="text-muted font-normal">— {s.authority}</span></p>
            <p className="text-sm"><StatusBadge state={s.state} label={FRESHNESS_LABELS[s.state]} /></p>
            <p className="text-sm text-muted mt-1">{s.coverageDescription}</p>
            <p className="text-sm mt-1">
              {s.state === "integration_pending" && <>Automated import is not live yet. Incident counts, categories, and trends will appear here once the source is integrated and its reuse terms are recorded. Until then, </>}
              {s.state === "coverage_not_available" && <>This agency does not publish a reusable feed. </>}
              <a className="underline" href={s.url} rel="noopener">view the agency’s own crime map</a>.
            </p>
          </div>
        ))}
        <p className="text-sm text-muted">Incidents shown here are <em>reported events</em>, not convictions. We compare an address only with its own preceding period and never publish a neighborhood “safety score”. <Link className="underline" href="/methodology#crime">Read the crime methodology</Link>.</p>
      </Card>

      <Card id="other" title="Development, roads, environment, flood and government" topic="Property · Development · Government">
        <p className="text-muted">These sources are catalogued for this address; each shows its integration state honestly.</p>
        <ul className="divide-y divide-border">
          {otherSources.map((s) => (
            <li key={s.key} className="py-2">
              <div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{s.name}</span><StatusBadge state={s.state} label={FRESHNESS_LABELS[s.state]} /></div>
              <p className="text-sm text-muted">{s.coverageDescription} · <a className="underline" href={s.url} rel="noopener">official source</a></p>
            </li>
          ))}
        </ul>
      </Card>

      <Card id="next" title="Get alerts for this address" topic="Watch">
        <SignupForm token={token} lookupId={row.publicId} addressSnapshot={row.normalizedAddress ?? undefined} countyFips={row.countyFips ?? undefined} />
        <p className="text-sm text-muted">Full property reports ($39) and recurring address watches are coming in the next release. <Link className="underline" href="/pricing">See plans</Link>.</p>
      </Card>

      <p className="text-xs text-muted">Preview generated {fetchedAt}. Lookup reference {row.publicId}. <Link className="underline" href="/disclaimers">Disclaimers</Link> · <Link className="underline" href="/contact">Request a correction</Link></p>
      <div className="max-w-3xl"><h2 className="font-semibold mb-2">Check another address</h2><AddressForm compact /></div>
    </div>
  );
}
