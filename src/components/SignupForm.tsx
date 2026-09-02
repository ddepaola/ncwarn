"use client";
import { useState, type FormEvent } from "react";
import { HONEYPOT_FIELD, TOKEN_FIELD } from "@/modules/notifications/honeypot";

export function SignupForm({ token, lookupId, addressSnapshot, countyFips }: { token: string; lookupId?: string; addressSnapshot?: string; countyFips?: string }) {
  const [state, setState] = useState<{ kind: "idle" | "busy" | "done" | "error"; message?: string }>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "busy" });
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/signup", { method: "POST", body: fd });
      const data = await res.json();
      setState({ kind: res.ok && data.ok ? "done" : "error", message: data.message });
    } catch { setState({ kind: "error", message: "Network error. Please try again." }); }
  }

  if (state.kind === "done") return <p role="status" className="font-medium">{state.message}</p>;
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name={TOKEN_FIELD} value={token} />
      {lookupId && <input type="hidden" name="lookupId" value={lookupId} />}
      {addressSnapshot && <input type="hidden" name="addressSnapshot" value={addressSnapshot} />}
      {countyFips && <input type="hidden" name="countyFips" value={countyFips} />}
      {/* Honeypot — hidden from people and screen readers; bots that fill it are dropped. */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor={`hp-${HONEYPOT_FIELD}`}>Leave this field empty</label>
        <input id={`hp-${HONEYPOT_FIELD}`} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <label htmlFor="signup-email" className="block font-medium">Email me when alerts launch for this address</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input id="signup-email" name="email" type="email" required autoComplete="email" className="flex-1 rounded border border-border px-3 py-2" placeholder="you@example.com" />
        <button type="submit" disabled={state.kind === "busy"} className="rounded bg-accent text-accent-ink px-4 py-2 font-semibold disabled:opacity-60">Notify me</button>
      </div>
      <p className="text-xs text-muted">One email when watches go live, plus optional updates. Unsubscribe any time. See our <a className="underline" href="/privacy">privacy policy</a>.</p>
      {state.kind === "error" && <p role="alert" className="text-warn">{state.message}</p>}
    </form>
  );
}
