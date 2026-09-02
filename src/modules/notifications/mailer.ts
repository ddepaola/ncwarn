import nodemailer from "nodemailer";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

/** Provider-agnostic SMTP adapter. With no SMTP_HOST configured, messages are logged (dev/staging). */
export interface Mail { to: string; subject: string; text: string; html?: string; replyTo?: string }

export async function sendMail(mail: Mail): Promise<{ delivered: boolean; id?: string }> {
  const env = getEnv();
  if (!env.SMTP_HOST) {
    logger.info({ to: mail.to, subject: mail.subject }, "mail (not sent: SMTP not configured)");
    return { delivered: false };
  }
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  const info = await transport.sendMail({ from: env.SMTP_FROM, ...mail });
  return { delivered: true, id: info.messageId };
}
