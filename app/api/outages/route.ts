import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

const querySchema = z.object({
  county: z.string().optional(),
  utility: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 'api:outages', { maxRequests: 120, windowMs: 60000 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    );
  }

  const { county, utility } = parsed.data;
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const where: Record<string, unknown> = {
    reportedAt: { gte: twentyFourHoursAgo },
  };

  if (county) {
    where.county = { slug: county };
  }

  if (utility) {
    where.utility = { contains: utility, mode: 'insensitive' };
  }

  const outages = await prisma.outage.findMany({
    where,
    include: {
      county: { select: { name: true, slug: true } },
    },
    orderBy: { customersOut: 'desc' },
    take: 200,
  });

  // Aggregate stats
  const totalOut = outages.reduce((sum, o) => sum + o.customersOut, 0);
  const byUtility: Record<string, number> = {};
  const byCounty: Record<string, number> = {};

  for (const outage of outages) {
    byUtility[outage.utility] = (byUtility[outage.utility] || 0) + outage.customersOut;
    byCounty[outage.county.name] = (byCounty[outage.county.name] || 0) + outage.customersOut;
  }

  return NextResponse.json({
    data: outages,
    summary: {
      totalCustomersOut: totalOut,
      byUtility,
      byCounty,
    },
    meta: {
      lastUpdated: new Date().toISOString(),
    },
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
