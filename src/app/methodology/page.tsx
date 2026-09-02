import type { Metadata } from "next";
export const metadata: Metadata = { title: "Methodology" };

export default function MethodologyPage() {
  return (
    <div className="prose-basic max-w-3xl">
      <h1 className="text-3xl font-bold">Methodology</h1>
      <p><strong>Version 0.1 · 2026-09-02.</strong> This page is versioned; material changes are dated here and in the changelog.</p>
      <h2>Address resolution</h2>
      <p>Addresses are normalized (whitespace, state aliases) and geocoded with the U.S. Census Bureau Geocoder, which also returns the county and incorporated place. We do not invent or “correct” addresses; ambiguous input is returned to you for correction. Coordinates are stored in WGS84 and radius searches use true-distance (geography) calculations.</p>
      <h2 id="crime">Reported crime activity</h2>
      <ul>
        <li>We use the heading “Reported Crime Activity Near This Property”. We do not compute a neighborhood safety score or label any area safe or unsafe.</li>
        <li>Incidents are <em>reported events</em>, not convictions. The original agency classification is preserved alongside our normalized category (violent offense, burglary, theft, motor-vehicle theft, vandalism, fraud, drug-related, weapons-related, other). Ambiguous incidents are never forced into a more serious category.</li>
        <li>Trends compare an address only with its own preceding equivalent period. No percentage is shown when either period has incomplete coverage. We never compare raw totals between jurisdictions with different reporting systems, and we do not compute per-capita rates for arbitrary radii.</li>
        <li>Locations are shown at no greater precision than the source provides.</li>
      </ul>
      <h2>Registered-offender information</h2>
      <p>We link to the official NC State Bureau of Investigation registry search and notification tools. We do not cache, mirror, or republish registrant records, photographs, or profiles, and we do not create offender pages.</p>
      <h2>Coverage and freshness</h2>
      <p>Every source resolves to one of six states (current, delayed, stale, temporarily unavailable, coverage not available, integration pending). “No matching records were returned by this integrated source” is different from “coverage unavailable”, and we never present the latter as zero.</p>
      <h2>Consistency and fair housing</h2>
      <p>Everyone who checks the same address at the same time receives the same available results and methodology. We do not personalize or suppress safety results, do not describe the demographic character of an area, and do not recommend moving toward or away from any neighborhood.</p>
      <h2>Corrections</h2>
      <p>Use the <a href="/contact">contact form</a> to request a correction. Administrators can mark an item disputed, suppress it from public view without deleting the source evidence, and link to corrected official information.</p>
    </div>
  );
}
