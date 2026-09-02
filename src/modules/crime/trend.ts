/**
 * Trend rules (handoff §7.3): compare only against the address's own preceding
 * equivalent period; never show a percentage when either period has incomplete coverage.
 */
export interface PeriodCount {
  count: number;
  complete: boolean; // coverage complete for the whole period
}

export type Trend =
  | { kind: "unavailable"; reason: "incomplete_coverage" | "no_baseline" }
  | { kind: "flat"; current: number; previous: number }
  | { kind: "change"; current: number; previous: number; percent: number; direction: "up" | "down" };

export function computeTrend(current: PeriodCount, previous: PeriodCount): Trend {
  if (!current.complete || !previous.complete) return { kind: "unavailable", reason: "incomplete_coverage" };
  if (previous.count === 0 && current.count === 0) return { kind: "flat", current: 0, previous: 0 };
  if (previous.count === 0) return { kind: "unavailable", reason: "no_baseline" };
  const percent = Math.round(((current.count - previous.count) / previous.count) * 100);
  if (percent === 0) return { kind: "flat", current: current.count, previous: previous.count };
  return { kind: "change", current: current.count, previous: previous.count, percent: Math.abs(percent), direction: percent > 0 ? "up" : "down" };
}

export const RADIUS_MILES = [0.5, 1, 3] as const;
export const TIME_RANGES_DAYS = [30, 90, 365] as const;
export const MILES_TO_METERS = 1609.344;
