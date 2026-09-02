import Link from "next/link";

const NAV = [
  ["/check", "Check an address"], ["/alerts", "Alerts"], ["/sources", "Sources"], ["/methodology", "Methodology"], ["/pricing", "Pricing"],
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link href="/" className="font-bold text-lg tracking-tight">
          <span className="text-accent">NC Risk Radar</span>
          <span className="sr-only"> — home</span>
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="text-muted hover:text-foreground underline-offset-4 hover:underline">{label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
