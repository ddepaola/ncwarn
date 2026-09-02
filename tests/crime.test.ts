import { describe, it, expect } from "vitest";
import { normalizeCategory } from "../src/modules/crime/categories";
import { computeTrend } from "../src/modules/crime/trend";

describe("crime category normalization", () => {
  it("maps agency classifications to normalized categories", () => {
    expect(normalizeCategory("BURGLARY/COMMERCIAL")).toBe("burglary");
    expect(normalizeCategory("Larceny From Auto")).toBe("theft");
    expect(normalizeCategory("Motor Vehicle Theft")).toBe("motor_vehicle_theft");
    expect(normalizeCategory("Aggravated Assault")).toBe("violent_offense");
    expect(normalizeCategory("Damage to Property")).toBe("vandalism");
    expect(normalizeCategory("Identity Theft")).toBe("fraud");
  });
  it("never escalates ambiguous classifications", () => {
    expect(normalizeCategory("Suspicious Activity")).toBe("other_reported_incident");
    expect(normalizeCategory("")).toBe("other_reported_incident");
    expect(normalizeCategory("Missing Person")).toBe("other_reported_incident");
  });
});

describe("trend rules", () => {
  it("hides percentage when either period is incomplete", () => {
    expect(computeTrend({ count: 10, complete: false }, { count: 5, complete: true })).toEqual({ kind: "unavailable", reason: "incomplete_coverage" });
  });
  it("computes direction and percent for complete periods", () => {
    expect(computeTrend({ count: 12, complete: true }, { count: 10, complete: true })).toEqual({ kind: "change", current: 12, previous: 10, percent: 20, direction: "up" });
    expect(computeTrend({ count: 5, complete: true }, { count: 10, complete: true })).toMatchObject({ direction: "down", percent: 50 });
  });
  it("refuses a percentage against a zero baseline", () => {
    expect(computeTrend({ count: 3, complete: true }, { count: 0, complete: true })).toEqual({ kind: "unavailable", reason: "no_baseline" });
    expect(computeTrend({ count: 0, complete: true }, { count: 0, complete: true })).toEqual({ kind: "flat", current: 0, previous: 0 });
  });
});
