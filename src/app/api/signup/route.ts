import { NextResponse, type NextRequest } from "next/server";
import { guardForm } from "@/modules/notifications/botGuard";
import { signupSchema, createSignup } from "@/modules/notifications/signup";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await readForm(req);
  const guard = await guardForm(req, form, "signup");
  if (!guard.ok) {
    if (guard.kind === "rate_limited") return NextResponse.json({ ok: false, message: "Too many attempts. Try again later." }, { status: 429 });
    return NextResponse.json({ ok: true, message: "Thanks — check your inbox." }); // silent for bots
  }
  const parsed = signupSchema.safeParse({ ...form, topics: toArray(form.topics) });
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Enter a valid email address." }, { status: 400 });
  await createSignup(parsed.data);
  return NextResponse.json({ ok: true, message: "Thanks — check your inbox for a confirmation." });
}

async function readForm(req: NextRequest): Promise<Record<string, unknown>> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const fd = await req.formData().catch(() => null);
  const out: Record<string, unknown> = {};
  fd?.forEach((v, k) => { out[k] = k in out ? ([] as unknown[]).concat(out[k] as unknown[], v) : v; });
  return out;
}
function toArray(v: unknown): string[] { return v == null ? [] : Array.isArray(v) ? v.map(String) : [String(v)]; }
