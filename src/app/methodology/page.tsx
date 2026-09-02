import type { Metadata } from "next";
export const metadata: Metadata = { title: "Methodology" };

export default function MethodologyPage() {
  return (
    <div className="prose-basic max-w-3xl">
      <h1 className="text-3xl font-bold">Methodology</h1>
      <p><strong>Version 0.2 · 2026-09-02.</strong> This page is versioned; material changes are dated here and in the changelog.</p>
      <h2>Address resolution</h2>
      <p>Addresses are normalized (whitespace, state aliases) and geocoded with the U.S. Census Bureau Geocoder, which also returns the county and incorporated place. We do not invent or “correct” addresses; ambiguous input is returned to you for correction. Coordinates are stored in WGS84 and radius searches use true-distance (geography) calculations.</p>
      <h2 id="crime">Reported crime activity</h2>
      <ul>
        <li>We use the heading “Reported Crime Activity Near This Property”. We do not compute a neighborhood safety score or label any area safe or unsafe.</li>
        <li>Incidents are <em>reported events</em>, not convictions. The original agency classification (for CMPD, the NIBRS highest-offense code and description) is preserved alongside our normalized category (violent offense, burglary, theft, motor-vehicle theft, vandalism, fraud, drug-related, weapons-related, other). Ambiguous incidents are never forced into a more serious category. Clearance status (open, cleared by arrest, exceptionally cleared, unfounded) is shown as published.</li>
        <li><strong>What is counted.</strong> Reported incidents whose published location falls within 0.5, 1 or 3 miles of the geocoded address, over the last 30, 90 or 365 days. Non-criminal reports that some agencies file in the same system (NIBRS 800-series: missing persons, sudden deaths, found property, and similar) are stored but excluded from counts and disclosed as a separate “excluded” figure.</li>
        <li><strong>Data through.</strong> Windows are anchored at the latest day the agency has published, which is shown on the card as “data through”. Agencies typically publish 2–3 days behind; a lagging source shortens the label, never the count silently.</li>
        <li><strong>Trends</strong> compare an address only with its own preceding equivalent period (for example the 90 days before the current 90 days). No percentage is shown when the imported history does not fully cover both periods, or when the preceding period had zero incidents. We never compare raw totals between jurisdictions with different reporting systems, and we do not compute per-capita rates for arbitrary radii.</li>
        <li><strong>Precision.</strong> Locations are shown at no greater precision than the source provides. CMPD publishes hundred-block addresses and masked coordinates, so radius counts near the edge of a radius are approximate and distances are rounded to a hundredth of a mile at most. Incidents with no usable coordinates are kept but cannot be counted in any radius.</li>
        <li><strong>Coverage.</strong> A count is shown only for addresses inside the reporting agency’s jurisdiction. Addresses in Mecklenburg towns with their own police departments (Huntersville, Cornelius, Davidson, Matthews, Mint Hill, Pineville) and in counties without an authorised feed receive a “coverage not available” notice and a link to the agency’s own map, never a misleading zero.</li>
        <li><strong>Re-imports.</strong> Each source is re-read on a schedule with an overlap window so late corrections and clearance updates are picked up; a record is identified by the agency’s incident number and updated in place when its content changes.</li>
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
