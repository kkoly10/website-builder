// app/auth/signout/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSiteUrl } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToLogin() {
  // Use your configured site URL so this works on Vercel + custom domain
  const base = getSiteUrl(); // includes trailing slash in your helper
  return new URL("/login?signedOut=1", base);
}

// If the user clicks a normal <Link href="/auth/signout">, this is a GET.
export async function GET() {
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