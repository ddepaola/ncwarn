import { NextResponse } from "next/server";
import { sqlClient } from "@/lib/db";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

/** Liveness + dependency check. Never leaks connection strings. */
export async function GET() {
  const checks: Record<string, "ok" | "fail"> = {};
  try { await sqlClient`select 1`; checks.postgres = "ok"; } catch { checks.postgres = "fail"; }
  try { await getRedis().ping(); checks.redis = "ok"; } catch { checks.redis = "fail"; }
  const ok = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json(
    { status: ok ? "ok" : "degraded", service: "nc-risk-radar-web", version: process.env.APP_VERSION ?? "dev", checks, time: new Date().toISOString() },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
