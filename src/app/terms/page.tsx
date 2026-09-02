import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms of use" };
export default function TermsPage() {
  return (
    <div className="prose-basic max-w-3xl">
      <h1 className="text-3xl font-bold">Terms of use</h1>
      <p><em>Draft pending counsel review. Effective 2026-09-02.</em></p>
      <ul>
        <li>The service provides informational summaries of public records with links to original sources. It does not provide legal, financial, or safety advice.</li>
        <li>You agree not to use any information from the service, including official registry links, to threaten, intimidate, stalk, harass, or discriminate against any person, and not to use it in violation of fair-housing or consumer-protection law.</li>
        <li>Automated scraping of the service is prohibited. Paid plans, when available, are subject to the plan terms shown at checkout.</li>
        <li>We may correct, suppress, or annotate results; suppressed items retain their source evidence for audit.</li>
      </ul>
    </div>
  );
}
