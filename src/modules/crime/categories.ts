/** Normalized crime categories (handoff §7.2). Original agency classification is always preserved separately. */
export const CRIME_CATEGORIES = [
  "violent_offense", "burglary", "theft", "motor_vehicle_theft", "vandalism",
  "fraud", "drug_related", "weapons_related", "other_reported_incident",
] as const;
export type CrimeCategory = (typeof CRIME_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<CrimeCategory, string> = {
  violent_offense: "Violent offense",
  burglary: "Burglary",
  theft: "Theft",
  motor_vehicle_theft: "Motor-vehicle theft",
  vandalism: "Vandalism",
  fraud: "Fraud",
  drug_related: "Drug-related incident",
  weapons_related: "Weapons-related incident",
  other_reported_incident: "Other reported incident",
};

/**
 * Rule table: agency classification → normalized category. Matching is by
 * case-insensitive keyword; ambiguous classifications fall to "other" rather
 * than being forced into a more serious bucket (§7.2).
 */
const RULES: Array<[RegExp, CrimeCategory]> = [
  [/\b(homicide|murder|manslaughter|robbery|aggravated assault|assault|rape|sex offense|kidnap|carjack)\b/i, "violent_offense"],
  [/\b(motor vehicle theft|auto theft|vehicle theft|stolen vehicle)\b/i, "motor_vehicle_theft"],
  [/\b(fraud|forgery|counterfeit|embezzle|identity theft|scam)\b/i, "fraud"], // before theft: "identity theft" is fraud
  [/\b(burglary|breaking and entering|b&e|break-?in)\b/i, "burglary"],
  [/\b(larceny|theft|shoplifting|stolen property|purse snatch)\b/i, "theft"],
  [/\b(vandalism|damage to property|criminal mischief|graffiti)\b/i, "vandalism"],
  [/\b(drug|narcotic|controlled substance|marijuana|cocaine|heroin|methamphetamine)\b/i, "drug_related"],
  [/\b(weapon|firearm|gun|shots fired|shooting into)\b/i, "weapons_related"],
];

export function normalizeCategory(agencyClassification: string): CrimeCategory {
  const s = agencyClassification.trim();
  if (!s) return "other_reported_incident";
  // "simple assault" is violent by NIBRS; "assault" already matches above.
  for (const [re, cat] of RULES) if (re.test(s)) return cat;
  return "other_reported_incident";
}
