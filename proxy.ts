import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

const intlMiddleware = createIntlMiddleware(routing);

// Routes whose path should NOT be rewritten by the i18n middleware. Anything
// that lives under app/api, app/internal, app/portal, app/auth, or static
// asset paths must be left alone — those routes are not under [locale] and
// must not get a locale prefix added.
function isLocaleAgnostic(pathname: string) {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/internal/") ||
    pathname.startsWith("/api") || // exact /api with no trailing slash
    pathname === "/internal" ||
    pathname.startsWith("/portal/") ||
    pathname === "/portal" ||
    pathname.startsWith("/auth/") ||
    pathname === "/auth" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/editor") ||
    pathname.startsWith("/pie-lab") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  );
}

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
  // For locale-bearing public pages, run next-intl first so its rewrite +
  // locale headers stay on the response we return. Then run Supabase
  // session refresh and copy any auth cookies it sets onto the intl
  // response (so we keep both the rewrite and the refreshed session).
  // API/internal/portal/auth routes skip the i18n step entirely — they
  // are not under [locale].
  // Stamp the original pathname onto downstream request headers so server
  // components (e.g. the [locale] layout's metadata helper) can read it via
  // headers(). Next 16 does not expose the path in Server Components by
  // default, so we use the official x-middleware-* protocol to propagate it.
  const stampHeaders = (response: NextResponse) => {
    const existing = response.headers.get("x-middleware-override-headers");
    response.headers.set(
      "x-middleware-override-headers",
      existing ? `${existing},x-pathname` : "x-pathname"
    );
    response.headers.set("x-middleware-request-x-pathname", pathname);
  };

  let response: NextResponse;
  if (isLocaleAgnostic(pathname)) {
    response = await updateSession(request);
    stampHeaders(response);
  } else {
    response = intlMiddleware(request);
    if (response.headers.get("location")) {
      return response;
    }
    const sessionResponse = await updateSession(request);
    sessionResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });
    stampHeaders(response);
  }

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
