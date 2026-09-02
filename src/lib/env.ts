import { z } from "zod";

/**
 * Runtime configuration. Validated once at process start; the process refuses to
 * boot with a bad config (handoff §14.1 "validate configuration at process startup").
 * Secrets are never logged — only the *names* of missing variables are reported.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1).default("redis://127.0.0.1:6379/0"),
  ADMIN_TOKEN: z.string().min(16, "ADMIN_TOKEN must be at least 16 chars").optional(),
  GEOCODER_PROVIDER: z.enum(["census", "none"]).default("census"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(25),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().default("NC Risk Radar <no-reply@ncwarn.com>"),
  CONTACT_TO: z.string().default("contact@ncwarn.com"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const names = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration — ${names}`);
  }
  cached = parsed.data;
  return cached;
}

export function isProd(): boolean {
  return getEnv().NODE_ENV === "production";
}
