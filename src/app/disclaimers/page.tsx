import type { Metadata } from "next";
export const metadata: Metadata = { title: "Disclaimers" };
export default function DisclaimersPage() {
  return (
    <div className="prose-basic max-w-3xl">
      <h1 className="text-3xl font-bold">Disclaimers</h1>
      <p><em>Draft pending counsel review.</em></p>
      <ul>
        <li>NCWarn.com / NC Risk Radar is an informational service. It is not law enforcement, legal advice, an official registry, or a guarantee of safety.</li>
        <li>Public records can be incomplete, delayed, corrected, or geographically imprecise. Reported incidents are not convictions.</li>
        <li>Absence of a result is not proof that no risk or event exists. Coverage varies by county and source and is always displayed.</li>
        <li>Verify important decisions with the original agency using the source links provided.</li>
        <li>Registry information must not be used to threaten, intimidate, stalk, or harass anyone. Misuse can be prosecuted.</li>
        <li>NC Risk Radar is not affiliated with NCWARN.org or the environmental nonprofit using the name “NC WARN”.</li>
      </ul>
    </div>
  );
}
