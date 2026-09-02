import { NextResponse, type NextRequest } from "next/server";
import { guardForm } from "@/modules/notifications/botGuard";
import { contactSchema, createContactMessage } from "@/modules/notifications/contact";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const fd = await req.formData().catch(() => null);
  const form: Record<string, unknown> = {};
  fd?.forEach((v, k) => { form[k] = v; });
  const guard = await guardForm(req, form, "contact", 3, 900);
  if (!guard.ok) {
    if (guard.kind === "rate_limited") return NextResponse.json({ ok: false, message: "Too many messages. Try again later." }, { status: 429 });
    return NextResponse.json({ ok: true, message: "Thanks — your message was received." });
  }
  const parsed = contactSchema.safeParse(form);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Please complete all required fields.", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  await createContactMessage(parsed.data);
  return NextResponse.json({ ok: true, message: "Thanks — your message was received." });
}
