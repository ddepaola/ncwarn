import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

const querySchema = z.object({
  county: z.string().optional(),
  from: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimit = await checkRateLimit(request, 'api:warn', { maxRequests: 60, windowMs: 60000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', resetAt: rateLimit.resetAt },
      { status: 429 }
    );
  }

  // Parse query params
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { county, from, to, page, limit } = parsed.data;

  // Build query
  const where: Record<string, unknown> = {};

  if (county) {
    where.county = { slug: county };
  }

  if (from || to) {
    where.noticeDate = {};
    if (from) {
      (where.noticeDate as Record<string, Date>).gte = new Date(`${from}-01`);
    }
    if (to) {
      const toDate = new Date(`${to}-01`);
      toDate.setMonth(toDate.getMonth() + 1);
      (where.noticeDate as Record<string, Date>).lt = toDate;
    }
  }

  const [notices, total] = await Promise.all([
    prisma.warnNotice.findMany({
      where,
      include: {
        county: { select: { name: true, slug: true } },
      },
      orderBy: { noticeDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.warnNotice.count({ where }),
  ]);

  return NextResponse.json({
    data: notices,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
