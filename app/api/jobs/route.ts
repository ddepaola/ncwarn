import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';
import { createOrder, isValidPlan, getPlanDetails } from '@/lib/payments';

// GET - List active jobs
const getSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  featured: z.coerce.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 'api:jobs', { maxRequests: 60, windowMs: 60000 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = getSchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const { page, featured } = parsed.data;
  const limit = 20;

  const where: Record<string, unknown> = {
    active: true,
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ],
  };

  if (featured !== undefined) {
    where.featured = featured;
  }

  const [jobs, total] = await Promise.all([
    prisma.jobPost.findMany({
      where,
      include: {
        county: { select: { name: true, slug: true } },
      },
      orderBy: [
        { featured: 'desc' },
        { postedAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.jobPost.count({ where }),
  ]);

  return NextResponse.json({
    data: jobs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST - Create new job posting (returns PayPal approval URL)
const postSchema = z.object({
  company: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  location: z.string().min(1).max(100),
  countySlug: z.string().optional(),
  description: z.string().min(10).max(5000),
  url: z.string().url().optional(),
  email: z.string().email(),
  plan: z.enum(['starter', 'growth', 'pro']),
});

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 'api:jobs:create', {
    maxRequests: 10,
    windowMs: 60000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { company, title, location, countySlug, description, url, email, plan } = parsed.data;

  // Find county if provided (NC-only for now)
  let countyId: number | null = null;
  if (countySlug) {
    const state = await prisma.state.findUnique({ where: { code: 'NC' } });
    if (state) {
      const county = await prisma.county.findFirst({
        where: { slug: countySlug, stateId: state.id },
      });
      if (county) {
        countyId = county.id;
      }
    }
  }

  // Get plan details
  const planDetails = getPlanDetails(plan);

  // Create pending job post
  const jobPost = await prisma.jobPost.create({
    data: {
      company,
      title,
      location,
      countyId,
      description,
      url: url || null,
      email,
      plan,
      featured: planDetails.featured,
      active: false, // Will be activated after payment
    },
  });

  // Create PayPal order
  const baseUrl = request.nextUrl.origin;
  try {
    const order = await createOrder(
      plan,
      `${baseUrl}/jobs?return=success&job=${jobPost.id}`,
      `${baseUrl}/jobs?return=cancel&job=${jobPost.id}`
    );

    // Update job with PayPal order ID
    await prisma.jobPost.update({
      where: { id: jobPost.id },
      data: { paypalOrderId: order.id },
    });

    return NextResponse.json({
      jobId: jobPost.id,
      orderId: order.id,
      approveUrl: order.approveUrl,
    });
  } catch (error) {
    // Clean up failed job post
    await prisma.jobPost.delete({ where: { id: jobPost.id } });

    console.error('PayPal order creation failed:', error);
    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    );
  }
}
