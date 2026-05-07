import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import {
  createRequiredActionForQuoteId,
  deleteRequiredActionForQuoteId,
  forceCompleteRequiredActionForQuoteId,
  listAllRequiredActionsForQuoteId,
  reopenRequiredActionForQuoteId,
  updateRequiredActionForQuoteId,
  type RequiredActionOwner,
  type RequiredActionStatus,
} from "@/lib/requiredActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_OWNERS: RequiredActionOwner[] = ["client", "studio", "system"];
const VALID_STATUSES: RequiredActionStatus[] = [
  "not_started",
  "waiting_on_client",
  "submitted",
  "complete",
  "blocked",
];

function asOwner(v: unknown): RequiredActionOwner | undefined {
  return typeof v === "string" && (VALID_OWNERS as string[]).includes(v)
    ? (v as RequiredActionOwner)
    : undefined;
}

function asStatus(v: unknown): RequiredActionStatus | undefined {
  return typeof v === "string" && (VALID_STATUSES as string[]).includes(v)
    ? (v as RequiredActionStatus)
    : undefined;
}

export async function GET(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  const quoteId = String(req.nextUrl.searchParams.get("quoteId") || "").trim();
  if (!quoteId) {
    return NextResponse.json({ ok: false, error: "quoteId required" }, { status: 400 });
  }

  try {
    const actions = await listAllRequiredActionsForQuoteId(quoteId);
    return NextResponse.json({ ok: true, actions });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load required actions" },
      { status: 500 },
    );
  }
}

// Single endpoint with action discriminator. Matches the existing
// quote-admin pattern so the admin client only needs to know one URL.
//
// body.action ∈ {create, update, delete, force_complete, reopen}
export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const quoteId = String(body?.quoteId || "").trim();
  const action = String(body?.action || "").trim();
  if (!quoteId) return NextResponse.json({ ok: false, error: "quoteId required" }, { status: 400 });
  if (!action) return NextResponse.json({ ok: false, error: "action required" }, { status: 400 });

  try {
    if (action === "create") {
      const created = await createRequiredActionForQuoteId({
        quoteId,
        actionKey: String(body?.actionKey || "").trim(),
        title: String(body?.title || "").trim(),
        owner: asOwner(body?.owner),
        description: typeof body?.description === "string" ? body.description : null,
        status: asStatus(body?.status),
        dueDate: typeof body?.dueDate === "string" ? body.dueDate : null,
        unlocksMilestoneKey:
          typeof body?.unlocksMilestoneKey === "string" ? body.unlocksMilestoneKey : null,
        payload: body?.payload && typeof body.payload === "object" ? body.payload : undefined,
      });
      return NextResponse.json({ ok: true, action: created });
    }

    const actionId = String(body?.actionId || "").trim();
    if (!actionId) {
      return NextResponse.json({ ok: false, error: "actionId required" }, { status: 400 });
    }

    if (action === "update") {
      const updated = await updateRequiredActionForQuoteId({
        quoteId,
        actionId,
        patch: {
          title: typeof body?.title === "string" ? body.title : undefined,
          description:
            body?.description === null
              ? null
              : typeof body?.description === "string"
                ? body.description
                : undefined,
          owner: asOwner(body?.owner),
          status: asStatus(body?.status),
          dueDate:
            body?.dueDate === null
              ? null
              : typeof body?.dueDate === "string"
                ? body.dueDate
                : undefined,
          unlocksMilestoneKey:
            body?.unlocksMilestoneKey === null
              ? null
              : typeof body?.unlocksMilestoneKey === "string"
                ? body.unlocksMilestoneKey
                : undefined,
          payload:
            body?.payload && typeof body.payload === "object" ? body.payload : undefined,
        },
      });
      if (!updated) {
        return NextResponse.json({ ok: false, error: "Action not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, action: updated });
    }

    if (action === "force_complete") {
      const updated = await forceCompleteRequiredActionForQuoteId({ quoteId, actionId });
      if (!updated) {
        return NextResponse.json({ ok: false, error: "Action not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, action: updated });
    }

    if (action === "reopen") {
      const updated = await reopenRequiredActionForQuoteId({
        quoteId,
        actionId,
        status: asStatus(body?.status),
      });
      if (!updated) {
        return NextResponse.json({ ok: false, error: "Action not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, action: updated });
    }

    if (action === "delete") {
      await deleteRequiredActionForQuoteId({ quoteId, actionId });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to process request" },
      { status: 500 },
    );
  }
}
