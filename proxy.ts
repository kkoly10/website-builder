import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// ── CORS Configuration ──────────────────────────────────────────────
// Only these origins can make API requests.
const ALLOWED_ORIGINS = new Set([
  "https://crecystudio.com",
  "https://www.crecystudio.com",
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Same-origin requests have no Origin header
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (origin.endsWith(".vercel.app")) return true;
  if (origin.startsWith("http://localhost:")) return true;
  return false;
}

// ── CSRF Protection ─────────────────────────────────────────────────
const CSRF_EXEMPT_PATHS = ["/api/webhooks/"];
const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p));
}

function isSensitivePath(pathname: string) {
  return pathname.startsWith("/internal") || pathname.startsWith("/api/internal");
}

async function sendInternalAlert(message: string) {
  const webhook = process.env.INTERNAL_ALERT_WEBHOOK?.trim();
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
  } catch {
    // non-blocking on proxy path
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get("origin");
  const method = request.method;

  // ── API routes: CORS + CSRF ─────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    // Handle CORS preflight
    if (method === "OPTIONS") {
      if (!isAllowedOrigin(origin)) {
        return new NextResponse(null, { status: 403 });
      }
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Block disallowed origins
    if (!isAllowedOrigin(origin)) {
      return NextResponse.json(
        { ok: false, error: "Origin not allowed" },
        { status: 403 }
      );
    }

    // CSRF: block cross-origin state-changing requests from unknown origins
    if (origin && STATE_CHANGING_METHODS.has(method) && !isCsrfExempt(pathname)) {
      const host = request.headers.get("host") || "";
      const originHost = new URL(origin).host;
      if (originHost !== host && !ALLOWED_ORIGINS.has(origin)) {
        console.warn(`[CSRF] Blocked cross-origin ${method} to ${pathname} from ${origin}`);
        return NextResponse.json(
          { ok: false, error: "Cross-origin request blocked" },
          { status: 403 }
        );
      }
    }
  }

  // ── Internal path logging ───────────────────────────────────────
  if (isSensitivePath(pathname)) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    console.log(`[internal-access] ${method} ${pathname} ip=${ip}`);

    if (method !== "GET") {
      await sendInternalAlert(`[internal-mutation] ${method} ${pathname} ip=${ip}`);
    }
  }

  // ── Session refresh + response ──────────────────────────────────
  const response = await updateSession(request);

  // Add security headers and CORS headers to API responses
  if (pathname.startsWith("/api/")) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");

    if (origin && isAllowedOrigin(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
