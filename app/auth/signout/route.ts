import { NextResponse } from "next/server";
import { createSupabaseServerClient, getSiteUrl } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", getSiteUrl()));
}
