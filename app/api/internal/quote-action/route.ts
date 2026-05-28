// app/api/internal/quote-action/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdminRoute } from "@/lib/routeAuth";
import { ensureCustomerPortalForQuoteId } from "@/lib/customerPortal";
import { captureBackgroundError } from "@/lib/sentry";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v: string): boolean {
  return UUID_RE.test(v);
}

// Whitelist of canonical quote status values the admin form is allowed
// to write. Without this, a hand-crafted form post could set status to
// any free-form string (the column has no DB-level enum), poisoning the
// admin pipeline filters and downstream lifecycle logic that branches on
// these exact values.
const ALLOWED_QUOTE_STATUSES = new Set([
  "new",
  "sent",
  "review",
  "proposal",
  "active",
  "scope_locked",
  "deposit",
  "deposit_sent",
  "deposit_paid",
  "closed_won",
  "closed_lost",
]);

// Deposit amounts are stored in dollars (numeric column, NOT cents).
// Cap at $1M — anything beyond is almost certainly a fat-finger or a
// fuzzed payload, and silently writing it could break downstream Stripe
// flows that pass `amount * 100` into APIs with their own integer caps.
const MAX_DEPOSIT_AMOUNT_USD = 1_000_000;

async function readBody(req: Request): Promise<Record<string, any>> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await req.json().catch(() => ({}))) as any;
  }
  const fd = await req.formData();
  return Object.fromEntries(fd.entries());
}

export async function POST(req: Request) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  const referer = req.headers.get("referer") || "/internal/dashboard";

  try {
    const body = await readBody(req);

    const action = String(body.action || "").trim();
    const quoteId = String(body.quoteId || "").trim();

    if (!quoteId || !isUuid(quoteId)) {
      return NextResponse.json({ error: "Missing or invalid quoteId" }, { status: 400 });
    }

    if (action === "update_status") {
      const status = String(body.status || "new").trim();

      if (!ALLOWED_QUOTE_STATUSES.has(status)) {
        return NextResponse.json(
          { error: `Invalid status: ${status}` },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin
        .from("quotes")
        .update({ status })
        .eq("id", quoteId);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      const workspaceStatuses = new Set(["active", "closed_won", "deposit_paid", "deposit_sent", "scope_locked"]);
      if (workspaceStatuses.has(status)) {
        ensureCustomerPortalForQuoteId(quoteId).catch((err) => {
          captureBackgroundError(err, {
            where: "quote-action.workspace_ensure",
            extra: { quoteId },
          });
        });
      }

      return NextResponse.redirect(referer, 303);
    }

    if (action === "lock_scope") {
      const { data, error: loadErr } = await supabaseAdmin
        .from("quotes")
        .select("scope_snapshot")
        .eq("id", quoteId)
        .maybeSingle();

      if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 400 });
      if (!data) return NextResponse.json({ error: "Quote not found." }, { status: 404 });

      const scope = (data as any)?.scope_snapshot ?? {};

      const { error: updErr } = await supabaseAdmin
        .from("quotes")
        .update({
          scope_locked_snapshot: scope,
          scope_locked_at: new Date().toISOString(),
          status: "scope_locked",
        })
        .eq("id", quoteId);

      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

      ensureCustomerPortalForQuoteId(quoteId).catch((err) => {
        captureBackgroundError(err, {
          where: "quote-action.workspace_ensure",
          extra: { quoteId },
        });
      });

      return NextResponse.redirect(referer, 303);
    }

    if (action === "set_deposit") {
      const deposit_link_raw = String(body.deposit_link || "").trim();
      let deposit_link: string | null = null;
      if (deposit_link_raw) {
        try {
          const url = new URL(deposit_link_raw);
          if (url.protocol !== "https:" && url.protocol !== "http:") {
            return NextResponse.json(
              { error: "deposit_link must use http or https" },
              { status: 400 }
            );
          }
          deposit_link = deposit_link_raw;
        } catch {
          return NextResponse.json(
            { error: "deposit_link is not a valid URL" },
            { status: 400 }
          );
        }
      }

      const deposit_amount_raw = body.deposit_amount;
      let deposit_amount: number | null = null;
      if (deposit_amount_raw !== undefined && deposit_amount_raw !== null && deposit_amount_raw !== "") {
        const parsed = Math.round(Number(deposit_amount_raw));
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_DEPOSIT_AMOUNT_USD) {
          return NextResponse.json(
            { error: `deposit_amount must be between 0 and ${MAX_DEPOSIT_AMOUNT_USD}` },
            { status: 400 }
          );
        }
        deposit_amount = parsed;
      }

      const { error } = await supabaseAdmin
        .from("quotes")
        .update({
          deposit_link,
          deposit_amount,
          deposit_status: deposit_link ? "sent" : null,
          deposit_sent_at: deposit_link ? new Date().toISOString() : null,
          status: deposit_link ? "deposit_sent" : undefined,
        })
        .eq("id", quoteId);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      if (deposit_link) {
        ensureCustomerPortalForQuoteId(quoteId).catch((err) => {
          captureBackgroundError(err, {
            where: "quote-action.workspace_ensure",
            extra: { quoteId },
          });
        });
      }

      return NextResponse.redirect(referer, 303);
    }

    if (action === "mark_deposit_paid") {
      const { error } = await supabaseAdmin
        .from("quotes")
        .update({
          deposit_status: "paid",
          deposit_paid_at: new Date().toISOString(),
          status: "deposit_paid",
        })
        .eq("id", quoteId);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      ensureCustomerPortalForQuoteId(quoteId).catch((err) => {
        captureBackgroundError(err, {
          where: "quote-action.workspace_ensure",
          extra: { quoteId },
        });
      });

      return NextResponse.redirect(referer, 303);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}