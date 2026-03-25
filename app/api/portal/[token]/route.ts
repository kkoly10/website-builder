// app/api/portal/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { applyPortalAction, getPortalBundleByToken } from "@/lib/portal/server";
import { sendEventNotification } from "@/lib/notifications";

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

    if (result.ok && result.data) {
      const actionType = body?.type;
      const eventMap: Record<string, string> = {
        revision_add: "revision_submitted",
        asset_add: "asset_submitted",
        deposit_notice_sent: "deposit_notice_sent",
      };

      const event = eventMap[actionType];
      if (event) {
        const data = result.data as any;
        const portalPath = data.quote?.publicToken
          ? `/portal/${data.quote.publicToken}`
          : undefined;
        const base = process.env.NEXT_PUBLIC_BASE_URL || "";
        const workspaceUrl = portalPath
          ? base
            ? `${base}${portalPath}`
            : portalPath
          : undefined;

        sendEventNotification({
          event,
          quoteId: data.quote?.id || "",
          leadName: data.lead?.name || "",
          leadEmail: data.lead?.email || "",
          workspaceUrl,
        }).catch((err) => {
          console.error("[portal] notification error:", err);
        });
      }
    }

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to update portal" },
      { status: 500 }
    );
  }
}