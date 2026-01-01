import { redis } from './redis';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
};

export async function rateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const { windowMs, maxRequests } = { ...defaultConfig, ...config };
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `ratelimit:${key}`;

  try {
    // Remove old entries
    await redis.zremrangebyscore(redisKey, 0, windowStart);

    // Count current requests
    const count = await redis.zcard(redisKey);

    if (count >= maxRequests) {
      const oldestEntry = await redis.zrange(redisKey, 0, 0, 'WITHSCORES');
      const resetAt = oldestEntry.length >= 2 ? parseInt(oldestEntry[1]) + windowMs : now + windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Add new request
    await redis.zadd(redisKey, now, `${now}-${Math.random()}`);
    await redis.expire(redisKey, Math.ceil(windowMs / 1000));

    return {
      allowed: true,
      remaining: maxRequests - count - 1,
      resetAt: now + windowMs,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open if Redis is unavailable
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: now + windowMs,
    };
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return '127.0.0.1';
}

export async function checkRateLimit(
  request: Request,
  endpoint: string,
  config?: Partial<RateLimitConfig>
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const key = `${endpoint}:${ip}`;
  return rateLimit(key, config);
}
