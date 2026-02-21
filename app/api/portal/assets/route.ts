// app/api/portal/assets/route.ts
import { NextResponse } from "next/server";
import { submitAssetByPortalToken } from "@/lib/customerPortal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const token = String(body?.token || "").trim();
    const label = String(body?.label || "").trim();
    const assetType = String(body?.assetType || "general").trim();
    const assetUrl = String(body?.assetUrl || "").trim();
    const notes = String(body?.notes || "").trim();

    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
    }
    if (!label) {
      return NextResponse.json({ ok: false, error: "Asset label is required" }, { status: 400 });
    }

    const row = await submitAssetByPortalToken({
      token,
      label,
      assetType,
      assetUrl,
      notes,
    });

    return NextResponse.json({ ok: true, asset: row });
  } catch (err: any) {
    console.error("portal/assets error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to submit asset" },
      { status: 500 }
    );
  }
}