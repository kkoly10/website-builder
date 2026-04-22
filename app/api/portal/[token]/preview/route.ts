import { NextRequest, NextResponse } from "next/server";
import { markPreviewViewedByToken } from "@/lib/projectActivity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getParams(
  ctx: { params: Promise<{ token: string }> | { token: string } }
) {
  return await Promise.resolve(ctx.params);
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const { token } = await getParams(ctx);
    const previewUrl = await markPreviewViewedByToken(token);
    return NextResponse.redirect(previewUrl);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Preview not available." },
      { status: 404 }
    );
  }
}
