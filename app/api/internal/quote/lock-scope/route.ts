// app/api/internal/quote/lock-scope/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireInternalToken } from "@/lib/internalToken";

export const runtime = "nodejs";

function pick(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function POST(req: Request) {
  const form = await req.formData();

  const token = pick(form, "token");
  const auth = requireInternalToken(token);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const quoteId = pick(form, "quoteId");
  if (!quoteId) return NextResponse.json({ error: "Missing quoteId" }, { status: 400 });

  // Load the current scope_snapshot
  const { data, error } = await supabaseAdmin
    .from("quotes")
    .select("id, scope_snapshot")
    .eq("id", quoteId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Quote not found" }, { status: 404 });
  }

  const updates = {
    locked_scope_snapshot: (data as any).scope_snapshot ?? {},
    scope_locked_at: new Date().toISOString(),
    status: "scope_locked",
  };

  const upd = await supabaseAdmin.from("quotes").update(updates).eq("id", quoteId);
  if (upd.error) {
    return NextResponse.json({ error: upd.error.message }, { status: 400 });
  }

  const url = new URL(req.url);
  url.pathname = "/internal/dashboard";
  url.search = `token=${encodeURIComponent(token)}&quoteId=${encodeURIComponent(quoteId)}`;
  return NextResponse.redirect(url, { status: 303 });
}