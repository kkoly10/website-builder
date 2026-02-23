// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseServerClient,
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

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email && isAdminEmail(user.email)) {
    return NextResponse.redirect(
      new URL(nextPath && nextPath.startsWith("/internal") ? nextPath : "/internal/admin", request.url)
    );
  }

  return NextResponse.redirect(
    new URL(nextPath || "/", request.url)
  );
}