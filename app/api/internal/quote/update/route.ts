// app/api/internal/quote/update/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireInternalToken } from "@/lib/internalToken";

export const runtime = "nodejs";

function pick(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

const VALID_STATUSES = new Set([
  "new",
  "awaiting_call",
  "call_scheduled",
  "scope_locked",
  "deposit_sent",
  "deposit_paid",
  "in_progress",
  "delivered",
  "closed_won",
  "closed_lost",
]);

export async function POST(req: Request) {
  const form = await req.formData();

  const token = pick(form, "token");
  const auth = requireInternalToken(token);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const quoteId = pick(form, "quoteId");
  if (!quoteId) {
    return NextResponse.json({ error: "Missing quoteId" }, { status: 400 });
  }

  const status = pick(form, "status");
  const internal_notes = pick(form, "internal_notes");
  const deposit_url = pick(form, "deposit_url");
  const deposit_status = pick(form, "deposit_status");

  const setDepositSent = pick(form, "setDepositSent") === "1";

  const updates: any = {};

  if (status) {
    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = status;
  }

  if (typeof internal_notes === "string") updates.internal_notes = internal_notes || null;

  if (typeof deposit_url === "string") updates.deposit_url = deposit_url || null;

  if (deposit_status) {
    updates.deposit_status = deposit_status;
    if (deposit_status === "sent") updates.deposit_sent_at = new Date().toISOString();
    if (deposit_status === "paid") updates.deposit_paid_at = new Date().toISOString();
  }

  // convenience: saving deposit URL should move pipeline forward
  if (setDepositSent) {
    if (deposit_url) {
      updates.status = "deposit_sent";
      updates.deposit_status = updates.deposit_status || "sent";
      updates.deposit_sent_at = updates.deposit_sent_at || new Date().toISOString();
    }
  }

  // If they set status to deposit_paid, ensure deposit_paid_at
  if (updates.status === "deposit_paid") {
    updates.deposit_status = "paid";
    updates.deposit_paid_at = updates.deposit_paid_at || new Date().toISOString();
  }

  const { error } = await supabaseAdmin.from("quotes").update(updates).eq("id", quoteId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Redirect back to quote page
  const url = new URL(req.url);
  url.pathname = "/internal/dashboard";
  url.search = `token=${encodeURIComponent(token)}&quoteId=${encodeURIComponent(quoteId)}`;
  return NextResponse.redirect(url, { status: 303 });
}