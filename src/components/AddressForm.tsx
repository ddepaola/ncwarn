"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AddressForm({ initial = "", compact = false }: { initial?: string; compact?: boolean }) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (value.trim().length < 8) { setError("Enter a street address including city or ZIP."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/address/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: value }) });
      const data = await res.json();
      if (!data.ok) { setError(data.message ?? "Lookup failed."); return; }
      router.push(`/check?lookup=${encodeURIComponent(data.lookupId)}`);
    } catch {
      setError("Network error. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={onSubmit} className="w-full" aria-describedby="address-help">
      <label htmlFor="address" className={compact ? "sr-only" : "block font-semibold mb-1"}>What do you want us to watch?</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input id="address" name="address" type="text" inputMode="text" autoComplete="street-address" required
          value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter a North Carolina street address"
          className="flex-1 rounded border border-border bg-card px-3 py-2.5 text-base" aria-invalid={error ? true : undefined} aria-errormessage={error ? "address-error" : undefined} />
        <button type="submit" disabled={busy} className="rounded bg-accent text-accent-ink px-5 py-2.5 font-semibold disabled:opacity-60">{busy ? "Checking…" : "Check address"}</button>
      </div>
      <p id="address-help" className="text-sm text-muted mt-1">Address search only for now — county, company, official and topic watches are coming soon.</p>
      {error && <p id="address-error" role="alert" className="text-warn mt-2">{error}</p>}
    </form>
  );
}
