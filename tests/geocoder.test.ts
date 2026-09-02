import { describe, it, expect, vi, afterEach } from "vitest";
import { censusGeocoder } from "../src/modules/address/geocoder";
import { resolveJurisdiction } from "../src/modules/coverage/jurisdiction";
import fixture from "./fixtures/census-onelineaddress.json";

afterEach(() => vi.unstubAllGlobals());

describe("census geocoder contract", () => {
  it("parses a Charlotte match into a GeocodeResult with county FIPS and place", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(fixture), { status: 200 })));
    const [r] = await censusGeocoder.geocode("600 E 4th St, Charlotte, NC 28202");
    expect(r.matchedAddress).toBe("600 E 4TH ST, CHARLOTTE, NC, 28202");
    expect(r.countyFips).toBe("37119");
    expect(r.countyName).toBe("Mecklenburg");
    expect(r.placeName).toBe("Charlotte");
    expect(r.stateCode).toBe("NC");
    expect(r.lng).toBeCloseTo(-80.83817, 4);
    const j = await resolveJurisdiction(r);
    expect(j).toMatchObject({ countyFips: "37119", countySlug: "mecklenburg", municipality: "Charlotte", inMvpArea: true });
  });
  it("returns no matches on empty result and throws on HTTP errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ result: { addressMatches: [] } }), { status: 200 })));
    expect(await censusGeocoder.geocode("nowhere")).toEqual([]);
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 502 })));
    await expect(censusGeocoder.geocode("x")).rejects.toThrow(/502/);
  });
});
