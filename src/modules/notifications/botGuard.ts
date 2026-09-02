import type { NextRequest } from "next/server";
import { checkSubmission } from "./honeypot";
import { rateLimit } from "@/lib/rateLimit";
import { clientIp, ipClass } from "@/lib/request";
import { db, schema } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Shared guard for public forms: honeypot + timing token + per-IP rate limit.
 * Bots get a generic 200 "thanks" (no signal), humans hitting limits get 429.
 */
export async function guardForm(req: NextRequest, form: Record<string, unknown>, formName: string, limit = 5, windowSec = 600) {
  const ip = clientIp(req);
  const cls = ipClass(ip);
  const verdict = checkSubmission(form);
  if (!verdict.ok) {
    logger.info({ form: formName, reason: verdict.reason, ipClass: cls }, "bot trap");
    db.insert(schema.botTraps).values({ form: formName, reason: verdict.reason, ipClass: cls }).catch(() => {});
    return { ok: false as const, kind: "bot" as const, ipClass: cls };
  }
  const rl = await rateLimit(`${formName}:${cls}`, limit, windowSec);
  if (!rl.allowed) {
    db.insert(schema.botTraps).values({ form: formName, reason: "rate_limited", ipClass: cls }).catch(() => {});
    return { ok: false as const, kind: "rate_limited" as const, ipClass: cls, resetSeconds: rl.resetSeconds };
  }
  return { ok: true as const, ipClass: cls };
}
