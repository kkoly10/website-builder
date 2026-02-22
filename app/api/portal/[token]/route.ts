// app/api/portal/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { applyPortalAction, getPortalBundleByToken } from "@/lib/portal/server";

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
    const result = await getPortalBundleByToken(token);
    return NextResponse.json(result, { status: result.ok ? 200 : 404 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load portal" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const { token } = await getParams(ctx);
    const body = await req.json();
    const result = await applyPortalAction(token, body);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to update portal" },
      { status: 500 }
    );
  }
}