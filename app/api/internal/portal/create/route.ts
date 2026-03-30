// app/api/internal/portal/create/route.ts
import { NextResponse } from "next/server";
import { ensureCustomerPortalForQuoteId } from "@/lib/customerPortal";
import { requireAdminRoute } from "@/lib/routeAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authErr = await requireAdminRoute();
    if (authErr) return authErr;

    const body = await req.json();
    const quoteId = String(body?.quoteId || "").trim();

    if (!quoteId) {
      return NextResponse.json(
        { ok: false, error: "quoteId is required" },
        { status: 400 }
      );
    }

    const portal = await ensureCustomerPortalForQuoteId(quoteId);

    const origin =
      req.headers.get("x-forwarded-proto") && req.headers.get("x-forwarded-host")
        ? `${req.headers.get("x-forwarded-proto")}://${req.headers.get(
            "x-forwarded-host"
          )}`
        : process.env.NEXT_PUBLIC_SITE_URL || "https://crecystudio.com";

    return NextResponse.json({
      ok: true,
      portalId: portal.id,
      token: portal.access_token,
      url: `${origin}/portal/${portal.access_token}`,
    });
  } catch (err: any) {
    console.error("portal/create error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to create portal" },
      { status: 500 }
    );
  }
}