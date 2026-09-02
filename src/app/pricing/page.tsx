import type { Metadata } from "next";
export const metadata: Metadata = { title: "Pricing" };

const PLANS = [
  ["Free preview", "$0", "Limited findings, source list, and coverage status for any NC address."],
  ["Full property report", "$39 one-time", "Complete current snapshot with source appendix and map. (Coming soon)"],
  ["Home Watch", "$9 / month", "One address with the alert topics and radius you choose. (Coming soon)"],
  ["Professional", "$49 / month", "Multiple addresses, saved searches, and reports for agents, investors and attorneys. (Coming soon)"],
  ["Business", "$99 / month", "Broader watches including contracts and regulation, higher limits. (Coming soon)"],
  ["Team", "from $199 / month", "Seats, shared watches, branding and administration. (Coming soon)"],
];

export default function PricingPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold">Pricing</h1>
      <p className="text-muted mt-2">Working prices during the preview period. Paid plans open with the next release; nothing is charged today.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {PLANS.map(([n, p, d]) => (
          <div key={n} className="bg-card border border-border rounded-lg p-4"><h2 className="font-semibold">{n}</h2><p className="text-xl mt-1">{p}</p><p className="text-sm text-muted mt-2">{d}</p></div>
        ))}
      </div>
    </div>
  );
}
