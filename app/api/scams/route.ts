import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

const querySchema = z.object({
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 'api:scams', { maxRequests: 60, windowMs: 60000 });
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

  const { category, page, limit } = parsed.data;

  const where: Record<string, unknown> = {};

  if (category) {
    where.category = { equals: category, mode: 'insensitive' };
  }

  const [alerts, total] = await Promise.all([
    prisma.scamAlert.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.scamAlert.count({ where }),
  ]);

  return NextResponse.json({
    data: alerts,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
