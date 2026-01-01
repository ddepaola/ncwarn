import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';

const querySchema = z.object({
  q: z.string().optional(),
  type: z.enum(['vehicle', 'product', 'food']).optional(),
  agency: z.enum(['NHTSA', 'CPSC', 'FDA', 'FSIS']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 'api:recalls', { maxRequests: 60, windowMs: 60000 });
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

  const { q, type, agency, page, limit } = parsed.data;

  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { affected: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (type) {
    where.category = type;
  }

  if (agency) {
    where.agency = agency;
  }

  const [recalls, total] = await Promise.all([
    prisma.recall.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.recall.count({ where }),
  ]);

  return NextResponse.json({
    data: recalls,
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
