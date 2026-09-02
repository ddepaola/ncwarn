import { describe, it, expect } from "vitest";
import { normalizeAddressInput, looksLikeStreetAddress } from "../src/modules/address/normalize";
import { parseEwkbPoint } from "../src/lib/db/types";

describe("address normalization", () => {
  it("tidies whitespace and state aliases", () => {
    const n = normalizeAddressInput("  123  Main St ,Waxhaw, north carolina 28173 ");
    expect(n.line).toBe("123 Main St, Waxhaw, NC 28173");
    expect(n.hasNcHint).toBe(true);
    expect(n.zip).toBe("28173");
  });
  it("detects missing NC hint", () => {
    expect(normalizeAddressInput("600 E 4th St, Charlotte").hasNcHint).toBe(false);
  });
  it("requires a house number and street", () => {
    expect(looksLikeStreetAddress("123 Main St, Waxhaw")).toBe(true);
    expect(looksLikeStreetAddress("Waxhaw NC")).toBe(false);
    expect(looksLikeStreetAddress("12")).toBe(false);
  });
});

describe("EWKB point parsing", () => {
  it("parses a little-endian SRID point", () => {
    // SRID=4326;POINT(-80.8431 35.2271)
    const hex = "0101000020E6100000" + le(-80.8431) + le(35.2271);
    const p = parseEwkbPoint(hex);
    expect(p.lng).toBeCloseTo(-80.8431, 4);
    expect(p.lat).toBeCloseTo(35.2271, 4);
  });
});
function le(n: number) { const b = Buffer.alloc(8); b.writeDoubleLE(n); return b.toString("hex"); }
