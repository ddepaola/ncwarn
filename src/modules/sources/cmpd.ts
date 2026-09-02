import { createHash } from "node:crypto";
import type { SourceAdapter, FetchContext, FetchArtifact, IntermediateRecord, ValidationResult } from "./adapter";
import { categoryForNibrs } from "@/modules/crime/nibrs";
import { logger } from "@/lib/logger";

/**
 * CMPD Incidents — City of Charlotte open data (ArcGIS REST MapServer layer 0).
 * Terms: see DATA_SOURCES.md (permitted, attribution "Charlotte-Mecklenburg Police").
 * Precision: block (public/masked coordinates). Non-criminal 800-series flagged.
 */
export const CMPD_SERVICE_URL = "https://gis.charlottenc.gov/arcgis/rest/services/CMPD/CMPDIncidents/MapServer/0";
export const CMPD_DATASET_URL = "https://data.charlottenc.gov/datasets/charlotte::cmpd-incidents-1/about";
const PAGE = 2000;
const FIELDS = [
  "INCIDENT_REPORT_ID", "GlobalID", "YEAR", "LOCATION", "CITY", "ZIP", "LATITUDE_PUBLIC", "LONGITUDE_PUBLIC",
  "DATE_REPORTED", "DATE_INCIDENT_BEGAN", "ADDRESS_DESCRIPTION", "LOCATION_TYPE_DESCRIPTION", "CLEARANCE_STATUS",
  "HIGHEST_NIBRS_CODE", "HIGHEST_NIBRS_DESCRIPTION", "CMPD_PATROL_DIVISION", "NPA",
];

export interface CmpdAttributes {
  INCIDENT_REPORT_ID: string; GlobalID?: string | null; YEAR?: string | null; LOCATION?: string | null; CITY?: string | null; ZIP?: string | null;
  LATITUDE_PUBLIC?: number | null; LONGITUDE_PUBLIC?: number | null; DATE_REPORTED?: number | null; DATE_INCIDENT_BEGAN?: number | null;
  ADDRESS_DESCRIPTION?: string | null; LOCATION_TYPE_DESCRIPTION?: string | null; CLEARANCE_STATUS?: string | null;
  HIGHEST_NIBRS_CODE?: string | null; HIGHEST_NIBRS_DESCRIPTION?: string | null; CMPD_PATROL_DIVISION?: string | null; NPA?: number | null;
}
interface ArcgisResponse { features?: Array<{ attributes: CmpdAttributes }>; exceededTransferLimit?: boolean; error?: { code: number; message: string } }

function fmtTs(d: Date): string { return d.toISOString().slice(0, 19).replace("T", " "); }

export function buildQueryUrl(since: Date, until: Date, offset: number): string {
  const u = new URL(`${CMPD_SERVICE_URL}/query`);
  u.searchParams.set("where", `DATE_REPORTED >= TIMESTAMP '${fmtTs(since)}' AND DATE_REPORTED < TIMESTAMP '${fmtTs(until)}'`);
  u.searchParams.set("outFields", FIELDS.join(","));
  u.searchParams.set("orderByFields", "DATE_REPORTED ASC, INCIDENT_REPORT_ID ASC");
  u.searchParams.set("resultOffset", String(offset));
  u.searchParams.set("resultRecordCount", String(PAGE));
  u.searchParams.set("returnGeometry", "false");
  u.searchParams.set("f", "json");
  return u.toString();
}

export const cmpdAdapter: SourceAdapter & { fetchWindow(since: Date, until: Date, signal?: AbortSignal): Promise<FetchArtifact[]> } = {
  key: "cmpd_incidents",
  parserVersion: "cmpd-v1",

  /** Pages through the service for a date window. Overlap with the previous run is handled by idempotent upsert. */
  async fetchWindow(since, until, signal) {
    const out: FetchArtifact[] = [];
    let offset = 0;
    for (let page = 0; page < 500; page++) {
      const url = buildQueryUrl(since, until, offset);
      const res = await fetch(url, { signal: signal ?? AbortSignal.timeout(60000), headers: { "User-Agent": "NCRiskRadar/0.1 (+https://ncwarn.com)" } });
      if (!res.ok) throw new Error(`CMPD HTTP ${res.status}`);
      const json = (await res.json()) as ArcgisResponse;
      if (json.error) throw new Error(`CMPD service error ${json.error.code}: ${json.error.message}`);
      const feats = json.features ?? [];
      out.push({ sourceUrl: url, fetchedAt: new Date(), contentType: "application/json", body: JSON.stringify(feats), meta: { offset, count: feats.length } });
      if (!json.exceededTransferLimit || feats.length === 0) break;
      offset += feats.length;
    }
    return out;
  },

  async fetch(ctx: FetchContext) {
    const until = new Date();
    const since = ctx.since ?? new Date(until.getTime() - 30 * 86400000);
    return this.fetchWindow(since, until, ctx.signal);
  },

  async parse(artifact) {
    const feats = JSON.parse(typeof artifact.body === "string" ? artifact.body : Buffer.from(artifact.body).toString("utf8")) as Array<{ attributes: CmpdAttributes }>;
    return feats.map((f): IntermediateRecord => ({
      externalId: String(f.attributes.INCIDENT_REPORT_ID ?? "").trim(),
      sourceUrl: CMPD_DATASET_URL,
      fetchedAt: artifact.fetchedAt,
      fields: f.attributes as unknown as Record<string, unknown>,
    }));
  },

  validate(rec): ValidationResult {
    const a = rec.fields as unknown as CmpdAttributes;
    const reasons: string[] = [];
    if (!rec.externalId) reasons.push("missing INCIDENT_REPORT_ID");
    if (!a.DATE_REPORTED || a.DATE_REPORTED < Date.UTC(2000, 0, 1) || a.DATE_REPORTED > Date.now() + 86400000) reasons.push("invalid DATE_REPORTED");
    const lat = a.LATITUDE_PUBLIC, lng = a.LONGITUDE_PUBLIC;
    const hasPoint = typeof lat === "number" && typeof lng === "number" && lat !== 0 && lng !== 0;
    if (hasPoint && (lat < 34.5 || lat > 36 || lng < -81.5 || lng > -80)) reasons.push("coordinates outside Mecklenburg bounds");
    if (!a.HIGHEST_NIBRS_DESCRIPTION && !a.HIGHEST_NIBRS_CODE) reasons.push("missing classification");
    return reasons.length ? { ok: false, reasons } : { ok: true };
  },

  async normalize(rec) {
    const a = rec.fields as unknown as CmpdAttributes;
    const { category } = categoryForNibrs(a.HIGHEST_NIBRS_CODE);
    return [{
      topic: "crime", type: "reported_incident",
      title: a.HIGHEST_NIBRS_DESCRIPTION ?? "Reported incident",
      summary: `${a.HIGHEST_NIBRS_DESCRIPTION ?? "Reported incident"} reported near ${a.LOCATION ?? "an undisclosed block"}`,
      responsibleParty: "Charlotte-Mecklenburg Police Department",
      eventDate: a.DATE_REPORTED ? new Date(a.DATE_REPORTED) : undefined,
      sourceUrl: CMPD_DATASET_URL, sourceExternalId: rec.externalId,
      location: typeof a.LATITUDE_PUBLIC === "number" && typeof a.LONGITUDE_PUBLIC === "number" && a.LATITUDE_PUBLIC !== 0
        ? { lng: a.LONGITUDE_PUBLIC, lat: a.LATITUDE_PUBLIC, precision: "block" as const }
        : { jurisdictionCountyFips: "37119", precision: "jurisdiction_only" as const },
      originalClassification: `${a.HIGHEST_NIBRS_CODE ?? ""} ${a.HIGHEST_NIBRS_DESCRIPTION ?? ""}`.trim(),
      ...(category ? {} : {}),
    }];
  },
};

/** Stable content hash of the fields we store — drives change detection on re-import. */
export function cmpdContentHash(a: CmpdAttributes): string {
  const keyFields = [a.INCIDENT_REPORT_ID, a.DATE_REPORTED, a.DATE_INCIDENT_BEGAN, a.LOCATION, a.CITY, a.ZIP, a.LATITUDE_PUBLIC, a.LONGITUDE_PUBLIC,
    a.HIGHEST_NIBRS_CODE, a.HIGHEST_NIBRS_DESCRIPTION, a.CLEARANCE_STATUS, a.LOCATION_TYPE_DESCRIPTION, a.CMPD_PATROL_DIVISION];
  return createHash("sha256").update(JSON.stringify(keyFields)).digest("hex");
}

void logger;
