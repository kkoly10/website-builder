import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import { markProposalSent } from "@/lib/proposals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ quoteId: string }> | { quoteId: string } }
) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  const { quoteId: rawId } = await Promise.resolve(ctx.params);
  const quoteId = rawId?.trim();
  if (!quoteId) {
    return NextResponse.json({ ok: false, error: "quoteId is required" }, { status: 400 });
  }

  try {
    await markProposalSent(quoteId);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
