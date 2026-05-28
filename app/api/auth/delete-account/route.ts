import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GDPR Article 17 — right to erasure. POST-only (DELETE works too but
// some browsers / fetch defaults don't send bodies on DELETE, and we
// want to support a confirmation token in the future).
//
// Strategy: anonymize records with business / legal retention value
// (quotes, invoices, agreements — needed for tax + dispute audit) and
// hard-delete the auth user. The customer's identifying information is
// removed; what remains is opaque audit history they cannot recover.
//
// This is intentionally conservative — a fully cascading delete would
// also break the project's audit trail (e.g. "who signed this
// agreement"). Anonymization is the standard interpretation of Article
// 17 when erasure conflicts with legal-basis retention.
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
  }

  // Require an explicit confirmation token in the body so a leaked CSRF
  // payload can't silently nuke an account. Caller (account-settings UI)
  // posts { confirm: "DELETE" }.
  let body: { confirm?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      { ok: false, error: 'Confirmation required. Send { "confirm": "DELETE" }.' },
      { status: 400 }
    );
  }

  // NFC-normalize before joining on email — leads/quotes/portal rows
  // may have been written from forms with precomposed Unicode while
  // the auth row uses decomposed (or vice versa). Without NFC two
  // visually-identical emails compare as different strings and the
  // anonymization silently misses rows.
  const email = normalizeEmail(user.email);
  const userId = user.id;
  const anonEmail = `deleted+${userId}@crecystudio.invalid`;
  const anonName = "Deleted user";
  const erasedAt = new Date().toISOString();

  // Best-effort cascade. Each step logs its own error rather than
  // throwing — partial completion is better than failing halfway and
  // leaving an orphaned auth user that the customer can't re-delete.
  const errors: string[] = [];

  if (email) {
    const leadsUpdate = await supabaseAdmin
      .from("leads")
      .update({
        email: anonEmail,
        name: anonName,
        phone: null,
        company: null,
        notes: "[erased]",
      })
      .eq("email", email);
    if (leadsUpdate.error) errors.push(`leads: ${leadsUpdate.error.message}`);

    const quotesUpdate = await supabaseAdmin
      .from("quotes")
      .update({
        lead_email: anonEmail,
        lead_name: anonName,
        lead_phone: null,
      })
      .eq("lead_email", email);
    if (quotesUpdate.error) errors.push(`quotes: ${quotesUpdate.error.message}`);

    const portalUpdate = await supabaseAdmin
      .from("customer_portal_projects")
      .update({
        client_email: anonEmail,
        client_name: anonName,
      })
      .eq("client_email", email);
    if (portalUpdate.error) errors.push(`portal: ${portalUpdate.error.message}`);
  }

  // Hard-delete the Supabase auth user. This invalidates sessions and
  // identities; the customer can no longer log in with this email.
  const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authDeleteError) {
    errors.push(`auth: ${authDeleteError.message}`);
    console.error("[auth.deleteAccount] auth delete failed:", authDeleteError);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Account erasure partially completed but auth user could not be deleted. Contact support.",
        details: errors,
      },
      { status: 500 }
    );
  }

  // Sign the client out so the now-orphaned session cookie can't be
  // used to refresh a token. signOut() against a deleted user is a
  // no-op on the server but still flushes the cookie.
  try {
    await supabase.auth.signOut();
  } catch {
    // signOut on a deleted user can throw; safe to ignore.
  }

  return NextResponse.json(
    {
      ok: true,
      erasedAt,
      anonymized: { email: anonEmail },
      warnings: errors.length ? errors : undefined,
    },
    { status: 200 }
  );
}
