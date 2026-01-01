import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

const querySchema = z.object({
  county: z.string().optional(),
  severity: z.enum(['extreme', 'severe', 'moderate', 'minor']).optional(),
  active: z.coerce.boolean().default(true),
});

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimit = await checkRateLimit(request, 'api:alerts', { maxRequests: 120, windowMs: 60000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { county, severity, active } = parsed.data;

  const where: Record<string, unknown> = {};

  if (county) {
    where.county = { slug: county };
  }

  if (severity) {
    where.severity = { equals: severity, mode: 'insensitive' };
  }

  if (active) {
    where.OR = [
      { status: { not: 'expired' } },
      { endsAt: { gt: new Date() } },
    ];
  }

  const alerts = await prisma.weatherAlert.findMany({
    where,
    include: {
      county: { select: { name: true, slug: true } },
    },
    orderBy: [
      { severity: 'desc' },
      { startsAt: 'desc' },
    ],
    take: 100,
  });

  return NextResponse.json({
    data: alerts,
    meta: {
      total: alerts.length,
      lastUpdated: new Date().toISOString(),
    },
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
