import { normalizeAddressInput, looksLikeStreetAddress } from "./normalize";
import { getGeocoder, type GeocodeResult } from "./geocoder";
import { resolveJurisdiction, type JurisdictionInfo } from "@/modules/coverage/jurisdiction";
import { logger } from "@/lib/logger";

export type ResolveFailure =
  | { ok: false; code: "invalid_input"; message: string }
  | { ok: false; code: "not_found"; message: string }
  | { ok: false; code: "outside_nc"; message: string }
  | { ok: false; code: "geocoder_unavailable"; message: string };

export interface ResolveSuccess {
  ok: true;
  input: string;
  normalizedInput: string;
  match: GeocodeResult;
  alternatives: GeocodeResult[];
  jurisdiction: JurisdictionInfo;
}

export type ResolveResult = ResolveSuccess | ResolveFailure;

/** Business rule: normalize → geocode → require NC → resolve county/municipality. */
export async function resolveAddress(raw: string): Promise<ResolveResult> {
  const norm = normalizeAddressInput(raw ?? "");
  if (!looksLikeStreetAddress(norm.line)) {
    return {
      ok: false, code: "invalid_input",
      message: "Enter a street address with a house number, street, and city or ZIP (for example: 123 Main St, Waxhaw, NC 28173).",
    };
  }
  const geocoder = getGeocoder();
  if (!geocoder) return { ok: false, code: "geocoder_unavailable", message: "Address lookup is temporarily unavailable." };

  let results: GeocodeResult[];
  try {
    // Bias toward NC when the user omitted the state.
    const line = norm.hasNcHint || norm.zip ? norm.line : `${norm.line}, NC`;
    results = await geocoder.geocode(line);
  } catch (err) {
    logger.error({ err, geocoder: geocoder.key }, "geocoder failure");
    return { ok: false, code: "geocoder_unavailable", message: "Address lookup is temporarily unavailable. Please try again in a moment." };
  }
  if (results.length === 0) {
    return { ok: false, code: "not_found", message: "We couldn't match that address. Check the house number and street, and include the city or ZIP." };
  }
  const nc = results.filter((r) => (r.stateCode ?? "").toUpperCase() === "NC" || (r.countyFips ?? "").startsWith("37"));
  if (nc.length === 0) {
    return { ok: false, code: "outside_nc", message: "That address appears to be outside North Carolina. NC Risk Radar currently covers North Carolina only." };
  }
  const [match, ...alternatives] = nc;
  const jurisdiction = await resolveJurisdiction(match);
  return { ok: true, input: raw, normalizedInput: norm.line, match, alternatives, jurisdiction };
}
