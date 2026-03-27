import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import {
  getWorkspaceState,
  saveWorkspaceState,
  type WorkspaceState,
} from "@/lib/opsWorkspace/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  const opsIntakeId = req.nextUrl.searchParams.get("opsIntakeId");
  if (!opsIntakeId) {
    return NextResponse.json({ ok: false, error: "Missing opsIntakeId" }, { status: 400 });
  }

  const data = await getWorkspaceState(opsIntakeId);
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const opsIntakeId = String(body?.opsIntakeId || "").trim();
    if (!opsIntakeId) {
      return NextResponse.json({ ok: false, error: "Missing opsIntakeId" }, { status: 400 });
    }

    const workspace =
      body?.workspace && typeof body.workspace === "object"
        ? (body.workspace as Partial<WorkspaceState>)
        : {};

    const patch: Partial<WorkspaceState> = { ...workspace };

    if (body?.adminNotes && typeof body.adminNotes === "object") {
      patch.adminNotes = body.adminNotes as Record<string, string>;
    }

    if (body?.tabOverrides && typeof body.tabOverrides === "object") {
      patch.tabOverrides = body.tabOverrides as Record<string, unknown>;
    }

    const result = await saveWorkspaceState(opsIntakeId, patch, "admin");
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    const data = await getWorkspaceState(opsIntakeId);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}