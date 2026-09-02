import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { resolveAddress } from "@/modules/address/resolve";
import { recordLookup } from "@/modules/address/lookups";
import { rateLimit } from "@/lib/rateLimit";
import { clientIp, ipClass } from "@/lib/request";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
const bodySchema = z.object({ address: z.string().min(1).max(300) });

export async function POST(req: NextRequest) {
  const cls = ipClass(clientIp(req));
  const rl = await rateLimit(`resolve:${cls}`, 30, 600);
  if (!rl.allowed) return NextResponse.json({ ok: false, code: "rate_limited", message: "Too many lookups. Please wait a few minutes." }, { status: 429, headers: { "Retry-After": String(rl.resetSeconds) } });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, code: "invalid_input", message: "Provide an address." }, { status: 400 });
  const result = await resolveAddress(parsed.data.address);
  let lookupId: string | undefined;
  try { lookupId = await recordLookup(parsed.data.address, result, cls); } catch (err) { logger.error({ err }, "recordLookup failed"); }
  if (!result.ok) return NextResponse.json({ ...result, lookupId }, { status: result.code === "geocoder_unavailable" ? 503 : 200 });
  return NextResponse.json({
    ok: true, lookupId, normalizedInput: result.normalizedInput,
    match: { address: result.match.matchedAddress, lng: result.match.lng, lat: result.match.lat, confidence: result.match.confidence, provider: result.match.provider },
    alternatives: result.alternatives.map((a) => a.matchedAddress),
    jurisdiction: result.jurisdiction,
  });
}
