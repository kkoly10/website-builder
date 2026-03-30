// middleware.ts
//
// Next.js middleware — runs on every request before the route handler.
// Handles CORS (restrict which sites can call your API) and
// CSRF protection (block forged cross-site form submissions).

import { NextRequest, NextResponse } from "next/server";

// ── CORS Configuration ──────────────────────────────────────────────
// Only these origins can make requests to your API.
// Add your production domain + any dev/preview URLs.
const ALLOWED_ORIGINS = new Set([
  "https://crecystudio.com",
  "https://www.crecystudio.com",
  // Vercel preview deploys (matched separately below)
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Same-origin requests have no Origin header
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // Allow Vercel preview deploys
  if (origin.endsWith(".vercel.app")) return true;
  // Allow localhost for development
  if (origin.startsWith("http://localhost:")) return true;
  return false;
}

// ── CSRF Protection ─────────────────────────────────────────────────
// Block state-changing requests (POST/PUT/PATCH/DELETE) from foreign origins.
// This is "Origin header checking" — the standard CSRF protection for APIs.
// Webhooks from Stripe are exempt since they have their own signature verification.

const CSRF_EXEMPT_PATHS = [
  "/api/webhooks/", // Stripe webhooks have their own signature auth
];

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin");
  const method = req.method;

  // ── Only apply to API routes ────────────────────────────────────
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ── Handle CORS preflight (OPTIONS) ─────────────────────────────
  if (method === "OPTIONS") {
    if (!isAllowedOrigin(origin)) {
      return new NextResponse(null, { status: 403 });
    }

    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // ── CORS: Block requests from disallowed origins ────────────────
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json(
      { ok: false, error: "Origin not allowed" },
      { status: 403 }
    );
  }

  // ── CSRF: Block cross-origin state-changing requests ────────────
  // If the request has an Origin header that differs from the host,
  // it's a cross-origin request. Block POST/PUT/PATCH/DELETE unless exempt.
  if (
    origin &&
    STATE_CHANGING_METHODS.has(method) &&
    !isCsrfExempt(pathname)
  ) {
    const host = req.headers.get("host") || "";
    const originHost = new URL(origin).host;

    // If origin host doesn't match the request host, it's cross-origin
    if (originHost !== host) {
      // Allow if from our known allowed origins (e.g. crecystudio.com calling API)
      if (!ALLOWED_ORIGINS.has(origin)) {
        console.warn(
          `[CSRF] Blocked cross-origin ${method} to ${pathname} from ${origin}`
        );
        return NextResponse.json(
          { ok: false, error: "Cross-origin request blocked" },
          { status: 403 }
        );
      }
    }
  }

  // ── Add CORS headers to the response ────────────────────────────
  const response = NextResponse.next();

  if (origin && isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
