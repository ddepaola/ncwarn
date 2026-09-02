import type { GeocodeResult } from "@/modules/address/geocoder";

/** MVP counties (handoff: launch Union + Mecklenburg; schema supports all 100). */
export const MVP_COUNTIES: Record<string, { name: string; slug: string }> = {
  "37179": { name: "Union", slug: "union" },
  "37119": { name: "Mecklenburg", slug: "mecklenburg" },
};

export interface JurisdictionInfo {
  stateCode: "NC";
  countyFips?: string;
  countyName?: string;
  countySlug?: string;
  municipality?: string | null; // null = unincorporated / not in an incorporated place
  inMvpArea: boolean;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function resolveJurisdiction(match: GeocodeResult): Promise<JurisdictionInfo> {
  const countyFips = match.countyFips;
  const mvp = countyFips ? MVP_COUNTIES[countyFips] : undefined;
  return {
    stateCode: "NC",
    countyFips,
    countyName: match.countyName ?? mvp?.name,
    countySlug: mvp?.slug ?? (match.countyName ? slugify(match.countyName) : undefined),
    municipality: match.placeName ?? null,
    inMvpArea: Boolean(mvp),
  };
}
