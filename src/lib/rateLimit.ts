import { getRedis } from "./redis";
import { logger } from "./logger";

export interface RateLimitResult { allowed: boolean; remaining: number; resetSeconds: number }

/**
 * Fixed-window limiter in Redis (atomic INCR + EXPIRE). Fails OPEN if Redis is
 * unreachable so an infrastructure blip never blocks legitimate users; the
 * failure is logged so it shows up in monitoring.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  try {
    const r = getRedis();
    const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
    const n = await r.incr(k);
    if (n === 1) await r.expire(k, windowSeconds);
    const ttl = await r.ttl(k);
    return { allowed: n <= limit, remaining: Math.max(0, limit - n), resetSeconds: ttl > 0 ? ttl : windowSeconds };
  } catch (err) {
    logger.warn({ err: (err as Error).message, key }, "rate limiter unavailable — failing open");
    return { allowed: true, remaining: limit, resetSeconds: windowSeconds };
  }
}
