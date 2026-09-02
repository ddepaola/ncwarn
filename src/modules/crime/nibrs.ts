import type { CrimeCategory } from "./categories";

/**
 * Deterministic NIBRS offense-code → normalized category mapping (handoff §7.2).
 * Codes not listed fall to "other_reported_incident" — never escalated.
 * 800-series codes are CMPD non-criminal report types and are excluded from counts.
 */
const NIBRS: Record<string, CrimeCategory> = {
  "09A": "violent_offense", "09B": "violent_offense", "09C": "violent_offense", // homicide
  "100": "violent_offense", // kidnapping/abduction
  "11A": "violent_offense", "11B": "violent_offense", "11C": "violent_offense", "11D": "violent_offense", // sex offenses (forcible)
  "36A": "violent_offense", "36B": "violent_offense", // sex offenses (non-forcible)
  "120": "violent_offense", // robbery
  "13A": "violent_offense", "13B": "violent_offense", // aggravated / simple assault
  "220": "burglary",
  "23A": "theft", "23B": "theft", "23C": "theft", "23D": "theft", "23E": "theft", "23F": "theft", "23G": "theft", "23H": "theft",
  "240": "motor_vehicle_theft",
  "250": "fraud", "26A": "fraud", "26B": "fraud", "26C": "fraud", "26D": "fraud", "26E": "fraud", "26F": "fraud", "26G": "fraud", "270": "fraud",
  "290": "vandalism",
  "35A": "drug_related", "35B": "drug_related",
  "520": "weapons_related",
};

export function categoryForNibrs(code: string | null | undefined): { category: CrimeCategory; nonCriminal: boolean } {
  const c = (code ?? "").trim().toUpperCase();
  if (/^8\d\d$/.test(c)) return { category: "other_reported_incident", nonCriminal: true };
  return { category: NIBRS[c] ?? "other_reported_incident", nonCriminal: false };
}
