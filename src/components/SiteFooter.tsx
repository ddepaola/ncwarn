import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-12 text-sm text-muted">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/about">About</Link><Link href="/contact">Contact & corrections</Link><Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link><Link href="/disclaimers">Disclaimers</Link><Link href="/sources">Source catalog</Link>
        </nav>
        <p>NC Risk Radar (NCWarn.com) is an informational service — not law enforcement, legal advice, an official registry, or a guarantee of safety. Public records can be incomplete, delayed, corrected, or geographically imprecise; absence of a result is not proof that no risk exists. Verify important decisions with the original agency.</p>
        <p>Not affiliated with NCWARN.org or the environmental nonprofit that uses the name “NC WARN”.</p>
        <p>© {new Date().getFullYear()} NCWarn.com · <a href="mailto:contact@ncwarn.com" className="underline">contact@ncwarn.com</a></p>
      </div>
    </footer>
  );
}
