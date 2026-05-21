import { NextResponse } from "next/server";
import { resolveQuoteAccess } from "@/lib/accessControl";
import { ensureWebsiteQuoteDepositLink } from "@/lib/depositPayments";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/stripeServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  quoteId?: string;
  quoteToken?: string;
  token?: string;
};

// Tight UUID validation before hitting the DB. Without this a fuzzed
// quoteId still parses through to `.eq("id", quoteId)` and either
// returns 0 rows (slow scan, wasted query budget) or — for sufficiently
// malformed input — surfaces a Postgres error directly to the caller.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v: string): boolean {
  return UUID_RE.test(v);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const quoteId = String(body.quoteId ?? "").trim();
    const quoteToken = String(body.quoteToken ?? body.token ?? "").trim();

    if (!quoteId || !isUuid(quoteId)) {
      return NextResponse.json({ error: "quoteId is required." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const access = await resolveQuoteAccess({
      quoteId,
      quoteToken: quoteToken || null,
      userId: user?.id ?? null,
      userEmail: normalizeEmail(user?.email),
    });

    if (!access.ok) {
      return NextResponse.json({ error: "Quote not found or access denied." }, { status: 404 });
    }

    const result = await ensureWebsiteQuoteDepositLink({
      quoteId,
      quoteToken: quoteToken || null,
      baseUrl: getBaseUrl(req),
    });

    return NextResponse.json({
      ok: true,
      depositUrl: result.depositUrl,
      depositAmount: result.depositAmount,
      reused: result.reused,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
