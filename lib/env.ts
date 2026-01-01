import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3015'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // PayPal
  PAYPAL_ENV: z.enum(['sandbox', 'live']).default('sandbox'),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),

  // Notifications
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  ONESIGNAL_APP_ID: z.string().optional(),
  ONESIGNAL_API_KEY: z.string().optional(),

  // Affiliates
  AFFILIATE_ENABLED: z.string().transform(v => v === 'true').default('false'),
  AMAZON_ASSOCIATE_TAG: z.string().optional(),
  AMAZON_ACCESS_KEY_ID: z.string().optional(),
  AMAZON_SECRET_ACCESS_KEY: z.string().optional(),

  // eBay
  EBAY_APP_ID: z.string().optional(),
  EBAY_CERT_ID: z.string().optional(),
  EBAY_DEV_ID: z.string().optional(),

  // Cloudflare
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_ACCOUNT_EMAIL: z.string().optional(),

  // GitHub
  GITHUB_USERNAME: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_REMOTE: z.string().optional(),

  // Careerjet
  CAREERJET_API_KEY: z.string().optional(),

  // AI Providers
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  PPLX_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = getEnv();

export function printSecurityWarning() {
  console.warn(`
╔════════════════════════════════════════════════════════════════════╗
║                       SECURITY WARNING                             ║
╠════════════════════════════════════════════════════════════════════╣
║  If any credentials were previously shared in plain text:          ║
║                                                                    ║
║  1. ROTATE ALL AFFECTED API KEYS AND PASSWORDS IMMEDIATELY         ║
║  2. Run: chmod 600 .env.local                                      ║
║  3. Consider using a secrets manager for production                ║
║  4. Never commit .env.local to version control                     ║
║                                                                    ║
║  Affected services to rotate:                                      ║
║  - Database credentials                                            ║
║  - PayPal API keys                                                 ║
║  - AI provider API keys (OpenAI, Anthropic, Google, Perplexity)    ║
║  - Cloudflare API tokens                                           ║
║  - GitHub tokens                                                   ║
║  - Amazon/eBay affiliate credentials                               ║
╚════════════════════════════════════════════════════════════════════╝
`);
}
