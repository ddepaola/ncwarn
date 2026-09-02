import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { publicId } from "@/lib/ids";
import type { ResolveResult } from "./resolve";

export async function recordLookup(input: string, result: ResolveResult, ipClassValue: string): Promise<string> {
  const id = publicId("lk");
  if (result.ok) {
    await db.insert(schema.addressLookups).values({
      publicId: id, inputAddress: input.slice(0, 300), normalizedAddress: result.match.matchedAddress,
      countyFips: result.jurisdiction.countyFips, municipality: result.jurisdiction.municipality ?? null,
      point: { lng: result.match.lng, lat: result.match.lat }, geocoder: result.match.provider,
      geocoderConfidence: result.match.confidence, success: true, ipClass: ipClassValue,
    });
  } else {
    await db.insert(schema.addressLookups).values({
      publicId: id, inputAddress: input.slice(0, 300), success: false, failureReason: result.code, ipClass: ipClassValue,
    });
  }
  return id;
}

export async function getLookup(id: string) {
  const [row] = await db.select().from(schema.addressLookups).where(eq(schema.addressLookups.publicId, id)).limit(1);
  return row ?? null;
}
