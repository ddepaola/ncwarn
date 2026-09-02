/**
 * Deterministic address normalization used before geocoding and for dedupe keys.
 * Conservative on purpose: we never "fix" an address, only tidy whitespace/case.
 */
const STATE_ALIASES: Record<string, string> = {
  "north carolina": "NC", "n.c.": "NC", "nc": "NC",
};

export interface NormalizedInput {
  line: string;          // single-line address as sent to the geocoder
  hasNcHint: boolean;    // input mentioned NC / North Carolina
  zip?: string;
}

export function normalizeAddressInput(raw: string): NormalizedInput {
  let s = raw.replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").trim();
  s = s.replace(/[^\x20-\x7E]/g, "");
  const zip = /\b(\d{5})(?:-\d{4})?\b/.exec(s)?.[1];
  const lower = s.toLowerCase();
  let hasNcHint = false;
  for (const [alias, code] of Object.entries(STATE_ALIASES)) {
    const re = new RegExp(`(^|[\\s,])${alias.replace(/\./g, "\\.")}(?=$|[\\s,])`, "i");
    if (re.test(lower)) {
      hasNcHint = true;
      s = s.replace(re, `$1${code}`);
    }
  }
  return { line: s, hasNcHint, zip };
}

export function looksLikeStreetAddress(line: string): boolean {
  // Needs a leading house number and at least one alphabetic street token.
  return /^\d{1,6}[a-z]?\s+[a-z0-9.'-]+/i.test(line) && line.length >= 8 && line.length <= 200;
}
