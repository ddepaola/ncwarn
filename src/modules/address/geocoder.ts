import { logger } from "@/lib/logger";
import { getEnv } from "@/lib/env";

/**
 * Geocoder abstraction (provider-independent). MVP provider: U.S. Census Bureau
 * Geocoder — public, keyless, returns county FIPS + place in one call. It is
 * batch-friendly and its terms permit this use; production may swap in a licensed
 * provider (handoff §20) without touching callers.
 */
export interface GeocodeResult {
  provider: string;
  providerResultId?: string;
  matchedAddress: string;
  lng: number;
  lat: number;
  confidence: number; // 0..1
  stateCode?: string;
  countyName?: string;
  countyFips?: string; // 5-digit
  placeName?: string;  // incorporated place, if any
  zip?: string;
  precision: "exact" | "block" | "intersection" | "centroid";
}

export interface Geocoder {
  key: string;
  geocode(line: string, signal?: AbortSignal): Promise<GeocodeResult[]>;
}

const CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";

type CensusMatch = {
  matchedAddress: string;
  coordinates: { x: number; y: number };
  tigerLine?: { side?: string; tigerLineId?: string };
  addressComponents?: { zip?: string; state?: string; city?: string };
  geographies?: Record<string, Array<Record<string, string>>>;
};

export const censusGeocoder: Geocoder = {
  key: "census",
  async geocode(line, signal) {
    const url = new URL(CENSUS_URL);
    url.searchParams.set("address", line);
    url.searchParams.set("benchmark", "Public_AR_Current");
    url.searchParams.set("vintage", "Current_Current");
    url.searchParams.set("format", "json");
    const res = await fetch(url, {
      signal: signal ?? AbortSignal.timeout(8000),
      headers: { "User-Agent": "NCRiskRadar/0.1 (+https://ncwarn.com)" },
    });
    if (!res.ok) throw new Error(`census geocoder HTTP ${res.status}`);
    const json = (await res.json()) as { result?: { addressMatches?: CensusMatch[] } };
    const matches = json.result?.addressMatches ?? [];
    return matches.map((m, i): GeocodeResult => {
      const county = m.geographies?.["Counties"]?.[0];
      const place = m.geographies?.["Incorporated Places"]?.[0];
      const countyFips = county ? `${county["STATE"]}${county["COUNTY"]}` : undefined;
      return {
        provider: "census",
        providerResultId: m.tigerLine?.tigerLineId ? `tl:${m.tigerLine.tigerLineId}:${m.tigerLine.side ?? ""}` : undefined,
        matchedAddress: m.matchedAddress,
        lng: m.coordinates.x,
        lat: m.coordinates.y,
        // Census returns matches in ranked order without a score; first = best.
        confidence: i === 0 ? (matches.length === 1 ? 0.9 : 0.7) : 0.4,
        stateCode: m.addressComponents?.state,
        countyName: county?.["NAME"]?.replace(/ County$/i, ""),
        countyFips,
        placeName: place?.["NAME"]?.replace(/ (city|town|village)$/i, ""),
        zip: m.addressComponents?.zip,
        precision: "exact",
      };
    });
  },
};

export function getGeocoder(): Geocoder | null {
  const provider = getEnv().GEOCODER_PROVIDER;
  if (provider === "census") return censusGeocoder;
  logger.warn({ provider }, "no geocoder configured");
  return null;
}
