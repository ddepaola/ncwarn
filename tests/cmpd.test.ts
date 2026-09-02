import { describe, it, expect } from "vitest";
import { cmpdAdapter, buildQueryUrl, cmpdContentHash, type CmpdAttributes } from "../src/modules/sources/cmpd";
import { categoryForNibrs } from "../src/modules/crime/nibrs";
import page from "./fixtures/cmpd-incidents-page.json";

const artifact = { sourceUrl: "fixture", fetchedAt: new Date("2025-06-08T00:00:00Z"), contentType: "application/json", body: JSON.stringify(page.features) };

describe("NIBRS → category mapping", () => {
  it("maps offense codes without escalating", () => {
    expect(categoryForNibrs("13A")).toEqual({ category: "violent_offense", nonCriminal: false });
    expect(categoryForNibrs("23F")).toEqual({ category: "theft", nonCriminal: false });
    expect(categoryForNibrs("240")).toEqual({ category: "motor_vehicle_theft", nonCriminal: false });
    expect(categoryForNibrs("26A")).toEqual({ category: "fraud", nonCriminal: false });
    expect(categoryForNibrs("220")).toEqual({ category: "burglary", nonCriminal: false });
    expect(categoryForNibrs("290")).toEqual({ category: "vandalism", nonCriminal: false });
    expect(categoryForNibrs("35A")).toEqual({ category: "drug_related", nonCriminal: false });
    expect(categoryForNibrs("520")).toEqual({ category: "weapons_related", nonCriminal: false });
    expect(categoryForNibrs("90Z")).toEqual({ category: "other_reported_incident", nonCriminal: false });
    expect(categoryForNibrs(null).category).toBe("other_reported_incident");
  });
  it("flags 800-series as non-criminal", () => {
    expect(categoryForNibrs("800")).toEqual({ category: "other_reported_incident", nonCriminal: true });
    expect(categoryForNibrs("850").nonCriminal).toBe(true);
  });
});

describe("CMPD adapter contract", () => {
  it("builds a bounded, paginated ArcGIS query", () => {
    const u = new URL(buildQueryUrl(new Date("2025-06-01T00:00:00Z"), new Date("2025-07-01T00:00:00Z"), 4000));
    expect(u.searchParams.get("where")).toBe("DATE_REPORTED >= TIMESTAMP '2025-06-01 00:00:00' AND DATE_REPORTED < TIMESTAMP '2025-07-01 00:00:00'");
    expect(u.searchParams.get("resultOffset")).toBe("4000");
    expect(u.searchParams.get("returnGeometry")).toBe("false");
    expect(u.searchParams.get("f")).toBe("json");
    expect(u.searchParams.get("outFields")).toContain("HIGHEST_NIBRS_CODE");
  });
  it("parses the fixture page into intermediate records", async () => {
    const recs = await cmpdAdapter.parse(artifact);
    expect(recs).toHaveLength(5);
    expect(recs[0].externalId).toBe("20250605-1130-01");
    expect(recs[0].fields.LOCATION).toBe("600 E 4TH ST");
  });
  it("validates: accepts good rows, keeps rows without coordinates, rejects bad rows", async () => {
    const recs = await cmpdAdapter.parse(artifact);
    const results = recs.map((r) => cmpdAdapter.validate(r));
    expect(results[0]).toEqual({ ok: true });
    expect(results[1]).toEqual({ ok: true });
    expect(results[2]).toEqual({ ok: true });
    expect(results[3]).toEqual({ ok: true }); // 0/0 coordinates → jurisdiction-only, still a valid incident
    expect(results[4].ok).toBe(false);
    if (!results[4].ok) expect(results[4].reasons).toEqual(expect.arrayContaining(["missing INCIDENT_REPORT_ID", "coordinates outside Mecklenburg bounds", "missing classification"]));
  });
  it("normalizes with block precision and never finer", async () => {
    const recs = await cmpdAdapter.parse(artifact);
    const [ev] = await cmpdAdapter.normalize(recs[0]);
    expect(ev.location).toEqual({ lng: -80.8382, lat: 35.2217, precision: "block" });
    expect(ev.eventDate?.toISOString()).toBe("2025-06-05T11:30:00.000Z");
    expect(ev.originalClassification).toBe("23F Theft From Motor Vehicle");
    const [noPoint] = await cmpdAdapter.normalize(recs[3]);
    expect(noPoint.location).toEqual({ jurisdictionCountyFips: "37119", precision: "jurisdiction_only" });
  });
  it("content hash changes only when stored fields change", () => {
    const a = page.features[0].attributes as unknown as CmpdAttributes;
    const same = cmpdContentHash({ ...a, NPA: 999 });
    const changed = cmpdContentHash({ ...a, CLEARANCE_STATUS: "Cleared by Arrest" });
    expect(cmpdContentHash(a)).toBe(same);
    expect(cmpdContentHash(a)).not.toBe(changed);
  });
});
