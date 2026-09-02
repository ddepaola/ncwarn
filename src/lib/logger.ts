import pino from "pino";

/**
 * Structured JSON logger. Redacts anything that looks like a secret so a stray
 * `logger.info({ env })` can never leak credentials (handoff §14.1).
 */
const level = process.env.LOG_LEVEL ?? "info";

export const logger = pino({
  level,
  base: { service: process.env.SERVICE_NAME ?? "web" },
  redact: {
    paths: [
      "*.password", "*.pass", "*.secret", "*.token", "*.apiKey", "*.api_key",
      "*.authorization", "*.cookie", "req.headers.authorization", "req.headers.cookie",
      "DATABASE_URL", "REDIS_URL", "SMTP_PASS", "ADMIN_TOKEN", "*.DATABASE_URL", "*.REDIS_URL",
      "*.SMTP_PASS", "*.ADMIN_TOKEN",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;
