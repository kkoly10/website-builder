import { NextResponse } from "next/server";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GDPR Article 20 — right to data portability. Returns a JSON dump of
// everything we have on the authenticated user, keyed by email (which
// is the join key across leads, quotes, and portal projects in this
// codebase). Designed for the user to download a copy — set
// Content-Disposition: attachment so browsers save rather than render.
//
// Anything that's not personal data (system events, generic activity
// types) is excluded; what's included is filtered to fields the user
// could have actually supplied or that we've derived from their input.
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
  }

  // NFC-normalize before joining — see delete-account/route.ts for the
  // homograph rationale. An export that quietly omits rows because of
  // Unicode normalization drift would fail GDPR Article 20.
  const email = normalizeEmail(user.email);

  // Collect everything in parallel. .maybeSingle()/.select with email
  // filters keep the queries scoped to the requester; admin operations
  // here aren't a privilege escalation because supabaseAdmin is server-
  // only and we never echo other users' data.
  const [leadsRes, quotesRes, portalsRes] = await Promise.all([
    email
      ? supabaseAdmin.from("leads").select("*").eq("email", email)
      : Promise.resolve({ data: [], error: null } as const),
    email
      ? supabaseAdmin.from("quotes").select("*").eq("lead_email", email)
      : Promise.resolve({ data: [], error: null } as const),
    email
      ? supabaseAdmin
          .from("customer_portal_projects")
          .select("*")
          .eq("client_email", email)
      : Promise.resolve({ data: [], error: null } as const),
  ]);

  // Strip Supabase-specific noise (search vectors, internal timestamps)
  // from the export so the file the user gets back is the data they
  // actually recognize as theirs.
  const cleanRow = (row: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = { ...row };
    delete out.search_vector;
    return out;
  };

  const payload = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      metadata: user.user_metadata,
    },
    leads: (leadsRes.data ?? []).map(cleanRow),
    quotes: (quotesRes.data ?? []).map(cleanRow),
    portalProjects: (portalsRes.data ?? []).map(cleanRow),
  };

  const filename = `crecystudio-data-export-${user.id.slice(0, 8)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
