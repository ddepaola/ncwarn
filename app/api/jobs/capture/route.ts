import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';
import { captureOrder, getPlanDetails } from '@/lib/payments';

const captureSchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 'api:jobs:capture', {
    maxRequests: 20,
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

  const parsed = captureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { orderId } = parsed.data;

  // Find job post by PayPal order ID
  const jobPost = await prisma.jobPost.findFirst({
    where: { paypalOrderId: orderId },
  });

  if (!jobPost) {
    return NextResponse.json(
      { error: 'Job post not found for this order' },
      { status: 404 }
    );
  }

  if (jobPost.active) {
    return NextResponse.json({
      message: 'Payment already processed',
      jobId: jobPost.id,
    });
  }

  // Capture the PayPal payment
  try {
    const capture = await captureOrder(orderId);

    if (capture.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment not completed', status: capture.status },
        { status: 400 }
      );
    }

    // Get plan details for expiration
    const planDetails = getPlanDetails(jobPost.plan as 'starter' | 'growth' | 'pro');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planDetails.duration);

    // Activate the job post
    const updatedJob = await prisma.jobPost.update({
      where: { id: jobPost.id },
      data: {
        active: true,
        featured: planDetails.featured,
        postedAt: new Date(),
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      jobId: updatedJob.id,
      message: 'Job posting activated successfully',
      expiresAt: updatedJob.expiresAt,
    });
  } catch (error) {
    console.error('PayPal capture failed:', error);
    return NextResponse.json(
      { error: 'Payment capture failed' },
      { status: 500 }
    );
  }
}
