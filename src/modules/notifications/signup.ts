import { z } from "zod";
import { db, schema } from "@/lib/db";
import { sendMail } from "./mailer";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  lookupId: z.string().trim().max(40).optional(),
  addressSnapshot: z.string().trim().max(300).optional(),
  countyFips: z.string().regex(/^\d{5}$/).optional(),
  topics: z.array(z.string().max(30)).max(10).default([]),
});
export type SignupInput = z.infer<typeof signupSchema>;

export async function createSignup(input: SignupInput) {
  const [row] = await db.insert(schema.emailSignups).values({
    email: input.email, lookupPublicId: input.lookupId ?? null, addressSnapshot: input.addressSnapshot ?? null,
    countyFips: input.countyFips ?? null, topics: input.topics, consentSource: "preview_form",
  }).onConflictDoNothing().returning({ id: schema.emailSignups.id });

  const env = getEnv();
  try {
    await sendMail({
      to: input.email,
      subject: "NC Risk Radar: you're on the list",
      text: [
        `Thanks for your interest in NC Risk Radar (${env.APP_URL}).`,
        input.addressSnapshot ? `Address preview: ${input.addressSnapshot}` : "",
        "We'll email you when address alerts launch for your area. No spam; one click to unsubscribe.",
        "",
        "NC Risk Radar / NCWarn.com is an informational service, not law enforcement, legal advice, or an official registry.",
        "It is not affiliated with NCWARN.org.",
      ].filter(Boolean).join("\n"),
    });
  } catch (err) {
    logger.error({ err }, "signup confirmation mail failed");
  }
  return { created: Boolean(row) };
}
