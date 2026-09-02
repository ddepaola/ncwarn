import type { ReactNode } from "react";

export function Card({ title, topic, children, footer, id }: { title: string; topic?: string; children: ReactNode; footer?: ReactNode; id?: string }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="bg-card border border-border rounded-lg p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <h2 id={id ? `${id}-h` : undefined} className="text-lg font-semibold">{title}</h2>
        {topic && <span className="text-xs uppercase tracking-wide text-muted border border-border rounded px-2 py-0.5">{topic}</span>}
      </div>
      <div className="space-y-2 text-[0.97rem]">{children}</div>
      {footer && <div className="mt-3 pt-3 border-t border-border text-sm text-muted">{footer}</div>}
    </section>
  );
}

export function StatusBadge({ state, label }: { state: string; label: string }) {
  // Severity is conveyed by text + icon, never by colour alone (WCAG).
  const icon = state === "current" ? "●" : state === "delayed" || state === "stale" ? "◐" : "○";
  return <span className="inline-flex items-center gap-1 text-sm font-medium"><span aria-hidden="true">{icon}</span>{label}</span>;
}
