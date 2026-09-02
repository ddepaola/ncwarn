import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge guard for /admin and /api/admin until Auth.js lands (Phase 3):
 * HTTP Basic with the ADMIN_TOKEN as password. Server-side role enforcement,
 * not hidden navigation (handoff §6.3). Real authorization also happens in handlers.
 */
export function proxy(req: NextRequest) {
  const token = process.env.ADMIN_TOKEN;
  const header = req.headers.get("authorization") ?? "";
  if (!token) return new NextResponse("Admin disabled: ADMIN_TOKEN not configured", { status: 503 });
  if (header.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const pass = decoded.slice(decoded.indexOf(":") + 1);
    if (pass.length === token.length && timingSafeEqualStr(pass, token)) {
      const res = NextResponse.next();
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
      return res;
    }
  }
  return new NextResponse("Authentication required", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="NC Risk Radar admin"' } });
}

function timingSafeEqualStr(a: string, b: string): boolean {
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
