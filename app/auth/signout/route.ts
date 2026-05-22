// app/auth/signout/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, getSiteUrl } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToLogin() {
  // Use your configured site URL so this works on Vercel + custom domain
  const base = getSiteUrl(); // includes trailing slash in your helper
  return new URL("/login?signedOut=1", base);
}

// Same-origin gate. The GET handler lets the user navigate to
// /auth/signout via a normal <Link>; without this gate, a third-party
// site could include <img src="https://crecystudio.com/auth/signout">
// and silently sign out anyone visiting that site. Requires the
// Origin or Referer header to match the site host (browsers always
// send one on cross-origin navigation, even if Origin is omitted on
// same-origin GETs).
function isSameOriginNavigation(req: NextRequest): boolean {
  try {
    const siteHost = new URL(getSiteUrl()).host.toLowerCase();
    const origin = req.headers.get("origin");
    if (origin) {
      try {
        return new URL(origin).host.toLowerCase() === siteHost;
      } catch {
        return false;
      }
    }
    const referer = req.headers.get("referer");
    if (referer) {
      try {
        return new URL(referer).host.toLowerCase() === siteHost;
      } catch {
        return false;
      }
    }
    // No Origin and no Referer — treat as cross-origin (the legitimate
    // <Link> click path always carries a Referer to the same host).
    return false;
  } catch {
    return false;
  }
}

// If the user clicks a normal <Link href="/auth/signout">, this is a GET.
export async function GET(req: NextRequest) {
  if (!isSameOriginNavigation(req)) {
    // Don't actually sign out — but redirect to login so the UX of a
    // direct browser navigation stays intact.
    return NextResponse.redirect(redirectToLogin(), 302);
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(redirectToLogin(), 302);
}

// If you ever submit a <form method="post" action="/auth/signout">, this is POST.
export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  // 303 is best practice for POST -> redirect
  return NextResponse.redirect(redirectToLogin(), 303);
}