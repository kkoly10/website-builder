import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import {
  saveWorkspaceState,
  getWorkspaceState,
  type WorkspaceState,
} from "@/lib/opsWorkspace/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  const opsIntakeId = req.nextUrl.searchParams.get("opsIntakeId");
  if (!opsIntakeId) {
    return NextResponse.json({ ok: false, error: "Missing opsIntakeId" }, { status: 400 });
  }

  const state = await getWorkspaceState(opsIntakeId);
  return NextResponse.json({ ok: true, data: state });
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const opsIntakeId = String(body.opsIntakeId || "").trim();
    if (!opsIntakeId) {
      return NextResponse.json({ ok: false, error: "Missing opsIntakeId" }, { status: 400 });
    }

    const patch: Partial<WorkspaceState> = {};
    if (body.adminNotes && typeof body.adminNotes === "object") {
      patch.adminNotes = body.adminNotes;
    }
    if (body.tabOverrides && typeof body.tabOverrides === "object") {
      patch.tabOverrides = body.tabOverrides;
    }

    const result = await saveWorkspaceState(opsIntakeId, patch, "admin");
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
