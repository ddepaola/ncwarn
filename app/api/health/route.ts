import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {};
  let healthy = true;

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latency: Date.now() - dbStart };
  } catch (error) {
    checks.database = { status: 'error' };
    healthy = false;
  }

  // Redis check
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = { status: 'ok', latency: Date.now() - redisStart };
  } catch (error) {
    checks.redis = { status: 'error' };
    // Redis failure is not critical
  }

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
