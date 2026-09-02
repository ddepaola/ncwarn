import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Bot protection for public forms without blocking accessibility (handoff §14.1):
 *  1. Honeypot field: visually hidden, `tabindex=-1`, `autocomplete=off`, labelled
 *     "Leave this field empty". Any value => bot.
 *  2. Timing token: a signed timestamp issued at render; submissions faster than
 *     MIN_FILL_MS or older than MAX_AGE_MS are rejected.
 * No CAPTCHA, no third-party scripts.
 */
export const HONEYPOT_FIELD = "website_url"; // deliberately attractive to bots
export const TOKEN_FIELD = "form_token";
const MIN_FILL_MS = 2500;
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

function secret(): string {
  return process.env.ADMIN_TOKEN || process.env.FORM_SECRET || "dev-only-secret-change-me";
}

export function issueFormToken(now = Date.now()): string {
  const ts = String(now);
  const sig = createHmac("sha256", secret()).update(ts).digest("hex").slice(0, 32);
  return `${ts}.${sig}`;
}

export type BotVerdict = { ok: true } | { ok: false; reason: "honeypot_filled" | "too_fast" | "invalid_token" | "expired_token" };

export function checkSubmission(form: { [k: string]: unknown }, now = Date.now()): BotVerdict {
  const hp = form[HONEYPOT_FIELD];
  if (typeof hp === "string" && hp.trim() !== "") return { ok: false, reason: "honeypot_filled" };
  const token = form[TOKEN_FIELD];
  if (typeof token !== "string") return { ok: false, reason: "invalid_token" };
  const [ts, sig] = token.split(".");
  if (!ts || !sig || !/^\d+$/.test(ts)) return { ok: false, reason: "invalid_token" };
  const expected = createHmac("sha256", secret()).update(ts).digest("hex").slice(0, 32);
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "invalid_token" };
  const age = now - Number(ts);
  if (age < MIN_FILL_MS) return { ok: false, reason: "too_fast" };
  if (age > MAX_AGE_MS) return { ok: false, reason: "expired_token" };
  return { ok: true };
}
