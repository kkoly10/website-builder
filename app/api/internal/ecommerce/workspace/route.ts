import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import {
  getEcommerceWorkspaceBundle,
  saveEcommerceWorkspaceState,
  type EcommerceWorkspaceState,
} from "@/lib/ecommerce/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  const ecomIntakeId = req.nextUrl.searchParams.get("ecomIntakeId");
  if (!ecomIntakeId) {
    return NextResponse.json({ ok: false, error: "Missing ecomIntakeId" }, { status: 400 });
  }

  const bundle = await getEcommerceWorkspaceBundle(ecomIntakeId, { isAdmin: true });
  if (!bundle) {
    return NextResponse.json({ ok: false, error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: bundle.workspace });
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const ecomIntakeId = String(body?.ecomIntakeId || "").trim();
    if (!ecomIntakeId) {
      return NextResponse.json({ ok: false, error: "Missing ecomIntakeId" }, { status: 400 });
    }

    const workspace =
      body?.workspace && typeof body.workspace === "object"
        ? (body.workspace as Partial<EcommerceWorkspaceState>)
        : {};

    const result = await saveEcommerceWorkspaceState({
      ecomIntakeId,
      patch: workspace,
      savedBy: "admin",
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    const bundle = await getEcommerceWorkspaceBundle(ecomIntakeId, { isAdmin: true });
    return NextResponse.json({ ok: true, data: bundle?.workspace || null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
