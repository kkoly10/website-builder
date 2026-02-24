import { NextRequest, NextResponse } from "next/server";
import {
  claimCustomerRecordsForUser,
  createSupabaseServerClient,
  getSiteUrl,
  isAdminUser,
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

  // For email verification / OAuth / magic-link flows
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", getSiteUrl()));
  }

  // Attach any existing website quotes / ops intakes to this user by email
  await claimCustomerRecordsForUser({
    userId: user.id,
    email: user.email,
  });

  const isAdmin = await isAdminUser({
    userId: user.id,
    email: user.email,
  });

  if (isAdmin) {
    const adminTarget = nextPath && nextPath.startsWith("/internal") ? nextPath : "/internal/admin";
    return NextResponse.redirect(new URL(adminTarget, getSiteUrl()));
  }

  const customerTarget = nextPath && !nextPath.startsWith("/internal") ? nextPath : "/portal";
  return NextResponse.redirect(new URL(customerTarget, getSiteUrl()));
}
