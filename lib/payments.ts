import { z } from 'zod';

const PLANS = {
  starter: { price: '99.00', featured: false, duration: 30 },
  growth: { price: '249.00', featured: true, duration: 30 },
  pro: { price: '399.00', featured: true, duration: 30 },
} as const;

export type PlanType = keyof typeof PLANS;

const paypalConfig = {
  env: (process.env.PAYPAL_ENV || 'sandbox') as 'sandbox' | 'live',
  clientId: process.env.PAYPAL_CLIENT_ID || '',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
};

const BASE_URL =
  paypalConfig.env === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  if (!paypalConfig.clientId || !paypalConfig.clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(
    `${paypalConfig.clientId}:${paypalConfig.clientSecret}`
  ).toString('base64');

  const response = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal auth failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export interface CreateOrderResult {
  id: string;
  approveUrl: string;
}

export async function createOrder(
  plan: PlanType,
  returnUrl: string,
  cancelUrl: string
): Promise<CreateOrderResult> {
  const planConfig = PLANS[plan];
  const token = await getAccessToken();

  const response = await fetch(`${BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: planConfig.price,
          },
          description: `NCWARN Job Post: ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        },
      ],
      application_context: {
        brand_name: 'NCWARN',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal create order failed: ${error}`);
  }

  const data = await response.json();
  const approveLink = data.links?.find(
    (link: { rel: string; href: string }) => link.rel === 'approve'
  );

  return {
    id: data.id,
    approveUrl: approveLink?.href || '',
  };
}

export interface CaptureOrderResult {
  status: string;
  payerId?: string;
  payerEmail?: string;
}

export async function captureOrder(orderId: string): Promise<CaptureOrderResult> {
  const token = await getAccessToken();

  const response = await fetch(`${BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal capture failed: ${error}`);
  }

  const data = await response.json();

  return {
    status: data.status,
    payerId: data.payer?.payer_id,
    payerEmail: data.payer?.email_address,
  };
}

export function getPlanDetails(plan: PlanType) {
  return PLANS[plan];
}

export const planSchema = z.enum(['starter', 'growth', 'pro']);

export function isValidPlan(plan: string): plan is PlanType {
  return plan in PLANS;
}
