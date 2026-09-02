import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

/** Client IP: trust Cloudflare/nginx headers only (we sit behind nginx which sets X-Real-IP). */
export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0"
  );
}

/** Privacy-preserving IP classification for logs/audit: salted hash, /24 for v4. */
export function ipClass(ip: string): string {
  const bucket = ip.includes(":") ? ip.split(":").slice(0, 4).join(":") + "::/64" : ip.split(".").slice(0, 3).join(".") + ".0/24";
  const salt = process.env.ADMIN_TOKEN ?? "salt";
  return createHash("sha256").update(`${salt}|${bucket}`).digest("hex").slice(0, 16);
}

export function requestId(req: NextRequest): string {
  return req.headers.get("x-request-id") || crypto.randomUUID();
}
