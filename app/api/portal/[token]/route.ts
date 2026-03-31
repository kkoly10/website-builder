// app/api/portal/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { applyPortalAction, getPortalBundleByToken } from "@/lib/portal/server";
import { sendEventNotification } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { resolveQuoteOwnerAccess } from "@/lib/accessControl";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getParams(
  ctx: { params: Promise<{ token: string }> | { token: string } }
) {
  return await Promise.resolve(ctx.params);
}

function withRedactedLead(result: any) {
  if (!result?.ok || !result?.data?.lead) return result;
  return {
    ...result,
    data: {
      ...result.data,
      lead: {
        ...result.data.lead,
        email: null,
        phone: null,
      },
    },
  };
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const { token } = await getParams(ctx);
    const result = await getPortalBundleByToken(token);
    return NextResponse.json(withRedactedLead(result), { status: result.ok ? 200 : 404 });
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
    const ip = getIpFromHeaders(req.headers);
    const rl = await enforceRateLimitDurable({ key: `portal-write:${ip}`, limit: 20, windowMs: 60_000 });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

    const { token } = await getParams(ctx);
    const body = await req.json();
    const actionType = String(body?.type || "").trim();
    const sensitiveActions = new Set(["agreement_accept", "deposit_notice_sent"]);

    let portal: any = null;
    if (sensitiveActions.has(actionType)) {
      portal = await getPortalBundleByToken(token);
      if (!portal?.ok || !portal?.data?.quote?.id) {
        return NextResponse.json({ ok: false, error: "Portal not found." }, { status: 404 });
      }

      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const ownerAccess = await resolveQuoteOwnerAccess({
        quoteId: String(portal.data.quote.id),
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
      });

      if (!ownerAccess.ok) {
        return NextResponse.json(
          { ok: false, error: "Sign in with the project email to complete this action." },
          { status: 403 }
        );
      }

      (body as any).__actorAudit = {
        userId: user?.id ?? null,
        email: user?.email ?? null,
        ip,
      };
    }

    const result = await applyPortalAction(token, body);

    if (result.ok && result.data) {
      if (actionType === "agreement_accept") {
        const audit = (body as any).__actorAudit || {};
        const publishedText = String(result.data.agreement?.publishedText || "");
        const acceptanceAudit = {
          acceptedAt: new Date().toISOString(),
          acceptedByUserId: audit.userId || null,
          acceptedByEmail: audit.email || null,
          acceptedFromIp: audit.ip || null,
          agreementStatus: result.data.agreement?.status || "accepted",
          agreementVersionHash: publishedText
            ? crypto.createHash("sha256").update(publishedText).digest("hex")
            : null,
        };

        const { data: existingQuote } = await supabaseAdmin
          .from("quotes")
          .select("debug")
          .eq("id", result.data.quote.id)
          .maybeSingle();

        const nextDebug =
          existingQuote?.debug && typeof existingQuote.debug === "object"
            ? { ...existingQuote.debug, agreementAcceptance: acceptanceAudit }
            : { agreementAcceptance: acceptanceAudit };

        await supabaseAdmin
          .from("quotes")
          .update({ debug: nextDebug })
          .eq("id", result.data.quote.id);
      }

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

    return NextResponse.json(withRedactedLead(result), { status: result.ok ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to update portal" },
      { status: 500 }
    );
  }
}
