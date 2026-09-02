"use client";
import { useState, type FormEvent } from "react";
import { HONEYPOT_FIELD, TOKEN_FIELD } from "@/modules/notifications/honeypot";

export function ContactForm({ token }: { token: string }) {
  const [state, setState] = useState<{ kind: "idle" | "busy" | "done" | "error"; message?: string }>({ kind: "idle" });
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "busy" });
    try {
      const res = await fetch("/api/contact", { method: "POST", body: new FormData(e.currentTarget) });
      const data = await res.json();
      setState({ kind: res.ok && data.ok ? "done" : "error", message: data.message });
    } catch { setState({ kind: "error", message: "Network error. Please try again." }); }
  }
  if (state.kind === "done") return <p role="status" className="font-medium">{state.message}</p>;
  const field = "w-full rounded border border-border px-3 py-2";
  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      <input type="hidden" name={TOKEN_FIELD} value={token} />
      <div className="hp-field" aria-hidden="true">
        <label htmlFor={`hpc-${HONEYPOT_FIELD}`}>Leave this field empty</label>
        <input id={`hpc-${HONEYPOT_FIELD}`} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <div><label htmlFor="c-kind" className="block font-medium">Reason</label>
        <select id="c-kind" name="kind" className={field} defaultValue="general">
          <option value="general">General question</option><option value="correction">Request a correction</option>
          <option value="press">Press</option><option value="partnership">Partnership / data licensing</option>
        </select></div>
      <div><label htmlFor="c-name" className="block font-medium">Name <span className="text-muted font-normal">(optional)</span></label><input id="c-name" name="name" className={field} autoComplete="name" /></div>
      <div><label htmlFor="c-email" className="block font-medium">Email</label><input id="c-email" name="email" type="email" required className={field} autoComplete="email" /></div>
      <div><label htmlFor="c-subject" className="block font-medium">Subject</label><input id="c-subject" name="subject" required minLength={3} maxLength={150} className={field} /></div>
      <div><label htmlFor="c-body" className="block font-medium">Message</label><textarea id="c-body" name="body" required minLength={10} maxLength={5000} rows={6} className={field} />
        <p className="text-xs text-muted mt-1">For corrections, include the address or result you are referring to and a link to the official record if you have one.</p></div>
      <button type="submit" disabled={state.kind === "busy"} className="rounded bg-accent text-accent-ink px-5 py-2.5 font-semibold disabled:opacity-60">Send message</button>
      {state.kind === "error" && <p role="alert" className="text-warn">{state.message}</p>}
    </form>
  );
}
