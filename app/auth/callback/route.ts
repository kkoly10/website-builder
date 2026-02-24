import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getSiteUrl,
  isAdminEmail,
  safeNextPath,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");
  const nextPath = safeNextPath(nextParam);

  const supabase = await createSupabaseServerClient();

  // For magic link / OAuth flows
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admins always go internal (unless next explicitly points to another internal page)
  if (user?.email && isAdminEmail(user.email)) {
    const adminTarget =
      nextPath && nextPath.startsWith("/internal") ? nextPath : "/internal/admin";
    return NextResponse.redirect(new URL(adminTarget, getSiteUrl()));
  }

  // Non-admins go to a real customer dashboard by default
  // If they came from a non-internal page, honor that
  const customerTarget =
    nextPath && !nextPath.startsWith("/internal") ? nextPath : "/portal";

  return NextResponse.redirect(new URL(customerTarget, getSiteUrl()));
}