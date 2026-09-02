import { z } from "zod";
import { db, schema } from "@/lib/db";
import { sendMail } from "./mailer";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export const contactSchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().toLowerCase().email().max(254),
  kind: z.enum(["general", "correction", "press", "partnership"]).default("general"),
  subject: z.string().trim().min(3).max(150),
  body: z.string().trim().min(10).max(5000),
});
export type ContactInput = z.infer<typeof contactSchema>;

export async function createContactMessage(input: ContactInput) {
  const [row] = await db.insert(schema.contactMessages).values({
    name: input.name ?? null, email: input.email, kind: input.kind, subject: input.subject, body: input.body,
  }).returning({ id: schema.contactMessages.id });
  const env = getEnv();
  try {
    const r = await sendMail({
      to: env.CONTACT_TO, replyTo: input.email,
      subject: `[NCWarn ${input.kind}] ${input.subject}`,
      text: `From: ${input.name ?? "(no name)"} <${input.email}>\nKind: ${input.kind}\n\n${input.body}`,
    });
    if (r.delivered) {
      const { eq } = await import("drizzle-orm");
      await db.update(schema.contactMessages).set({ deliveredAt: new Date() }).where(eq(schema.contactMessages.id, row.id));
    }
  } catch (err) {
    logger.error({ err }, "contact mail failed");
  }
  return { id: row.id };
}
