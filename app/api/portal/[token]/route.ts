// app/api/portal/[token]/route.ts
import { NextRequest, NextResponse, after } from "next/server";
import crypto from "node:crypto";
import {
  acceptCustomerPortalAgreement,
  getCustomerPortalViewByToken,
  getPortalProjectByToken,
  submitAssetByPortalToken,
  submitDesignDirectionByPortalToken,
  submitDirectionByPortalToken,
  submitRevisionByPortalToken,
  toggleMilestone,
  updateClientStatus,
} from "@/lib/customerPortal";
import { validateDesignDirectionInput } from "@/lib/designDirection";
import { validateDirectionPayload } from "@/lib/directions/validate";
import { isProjectType, type DirectionType } from "@/lib/workflows/types";
import { sendEventNotification } from "@/lib/notifications";
import { listProjectActivityByToken, markClientPortalSeen } from "@/lib/projectActivity";
import { listProjectInvoicesByToken } from "@/lib/projectInvoices";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { resolveQuoteOwnerAccess } from "@/lib/accessControl";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateAndDeliverCertificate } from "@/lib/certificates/generate";

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

function sanitizeExternalUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function withInvoices(result: any, token: string) {
  if (!result?.ok || !result?.data) return result;
  const invoices = await listProjectInvoicesByToken(token);
  const activityFeed = await listProjectActivityByToken(token, {
    clientOnly: true,
    limit: 24,
  });
  return {
    ...result,
    data: {
      ...result.data,
      invoices,
      activityFeed,
    },
  };
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const { token } = await getParams(ctx);
    await markClientPortalSeen(token);
    const result = await getCustomerPortalViewByToken(token, { markReadAs: "client" });
    const decorated = await withInvoices(result, token);
    return NextResponse.json(withRedactedLead(decorated), { status: result.ok ? 200 : 404 });
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

    if (token === "demo") {
      return NextResponse.json(
        { ok: false, error: "This is a read-only demo workspace. No changes can be saved." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const actionType = String(body?.type || "").trim();
    const sensitiveActions = new Set(["agreement_accept", "deposit_notice_sent"]);

    if (actionType === "asset_add") {
      const safeUrl = sanitizeExternalUrl(body?.asset?.url);
      if (!safeUrl) {
        return NextResponse.json(
          { ok: false, error: "Asset URL must be a valid http or https link." },
          { status: 400 }
        );
      }
      body.asset = {
        ...(body.asset || {}),
        url: safeUrl,
      };
    }

    let portal: any = null;
    if (sensitiveActions.has(actionType)) {
      portal = await getCustomerPortalViewByToken(token);
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
        userAgent: req.headers.get("user-agent") || null,
      };
    }

    if (actionType === "revision_add") {
      const message = String(body?.revision?.message || "").trim();
      if (!message) {
        return NextResponse.json(
          { ok: false, error: "Revision request message is required." },
          { status: 400 }
        );
      }

      await submitRevisionByPortalToken({
        token,
        requestText: message,
        priority: body?.revision?.priority,
      });
    } else if (actionType === "asset_add") {
      const safeUrl = sanitizeExternalUrl(body?.asset?.url);
      if (!safeUrl) {
        return NextResponse.json(
          { ok: false, error: "Asset URL must be a valid http or https link." },
          { status: 400 }
        );
      }

      await submitAssetByPortalToken({
        token,
        assetType: String(body?.asset?.category || body?.asset?.assetType || "general"),
        label: String(body?.asset?.label || "Client link"),
        assetUrl: safeUrl,
        notes: String(body?.asset?.notes || ""),
      });
    } else if (actionType === "deposit_notice_sent") {
      const note = [
        typeof body?.clientNotes === "string" ? body.clientNotes : "",
        typeof body?.note === "string"
          ? body.note
          : "Client reported that the deposit was sent and is awaiting verification.",
      ]
        .filter(Boolean)
        .join("\n")
        .trim();

      await updateClientStatus(token, "deposit_sent", note);
    } else if (actionType === "agreement_accept") {
      await acceptCustomerPortalAgreement(token);
    } else if (actionType === "client_status") {
      await updateClientStatus(
        token,
        String(body?.clientStatus || "new"),
        typeof body?.clientNotes === "string" ? body.clientNotes : undefined
      );
    } else if (actionType === "direction_submit") {
      // Lane-agnostic direction submit (Phase 3.3) for non-website
      // projects. The website lane keeps using design_direction_submit
      // below — different validation, different storage path.
      const portal = await getPortalProjectByToken(token);
      if (!portal) {
        return NextResponse.json({ ok: false, error: "Portal not found." }, { status: 404 });
      }
      const projectType = isProjectType(portal.project_type)
        ? portal.project_type
        : "website";
      if (projectType === "website") {
        return NextResponse.json(
          { ok: false, error: "Use design_direction_submit for website projects." },
          { status: 400 },
        );
      }
      const directionType: DirectionType =
        projectType === "web_app" ? "product_direction"
        : projectType === "automation" ? "workflow_direction"
        : projectType === "ecommerce" ? "store_direction"
        : "rescue_diagnosis";

      const validation = validateDirectionPayload(directionType, body?.direction);
      if (!validation.ok || !validation.value) {
        return NextResponse.json(
          { ok: false, error: validation.error || "Direction payload is invalid." },
          { status: 400 },
        );
      }

      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      try {
        await submitDirectionByPortalToken({
          token,
          payload: validation.value.payload,
          approvedDirectionTerms: validation.value.approvedDirectionTerms,
          actor: {
            userId: user?.id ?? null,
            email: user?.email ?? null,
            ip,
          },
        });
      } catch (err: any) {
        return NextResponse.json(
          { ok: false, error: err?.message || "Direction submit failed." },
          { status: 400 },
        );
      }
    } else if (actionType === "design_direction_submit") {
      const validation = validateDesignDirectionInput(body?.designDirection);
      if (!validation.ok || !validation.value) {
        return NextResponse.json(
          { ok: false, error: validation.error || "Design direction payload is invalid." },
          { status: 400 },
        );
      }

      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await submitDesignDirectionByPortalToken({
        token,
        direction: validation.value,
        actor: {
          userId: user?.id ?? null,
          email: user?.email ?? null,
          ip,
        },
      });
    } else if (actionType === "milestone_toggle") {
      const milestoneId = String(body?.key || "").trim();
      if (!milestoneId) {
        return NextResponse.json(
          { ok: false, error: "Milestone id is required." },
          { status: 400 }
        );
      }

      await toggleMilestone(token, milestoneId, !!body?.done);
    } else {
      return NextResponse.json(
        { ok: false, error: "Unknown portal action." },
        { status: 400 }
      );
    }

    const result = await getCustomerPortalViewByToken(token);

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

        // Write to agreements table and fire certificate generation
        const { data: portalRow } = await supabaseAdmin
          .from("customer_portal_projects")
          .select("id")
          .eq("access_token", token)
          .maybeSingle();

        if (portalRow?.id) {
          const { data: agrRow, error: insertError } = await supabaseAdmin
            .from("agreements")
            .insert({
              portal_project_id: portalRow.id,
              body_text: publishedText,
              body_hash: acceptanceAudit.agreementVersionHash || "",
              published_at: result.data.agreement?.publishedAt || new Date().toISOString(),
              accepted_at: acceptanceAudit.acceptedAt,
              accepted_by_email: acceptanceAudit.acceptedByEmail || null,
              accepted_ip: acceptanceAudit.acceptedFromIp || null,
              accepted_user_agent: audit.userAgent || null,
              status: "accepted",
            })
            .select("id")
            .single();

          if (insertError) {
            console.error("[portal] agreements insert error:", insertError.message);
          }

          const agreementId = agrRow?.id ?? null;
          const clientEmail = result.data.lead?.email ?? null;

          if (agreementId && clientEmail) {
            const certInput = {
              agreementId,
              quoteId: String(result.data.quote.id),
              leadName: result.data.lead?.name || "",
              leadEmail: clientEmail,
              agreementText: publishedText,
              acceptedAt: acceptanceAudit.acceptedAt,
              acceptedByEmail: acceptanceAudit.acceptedByEmail,
              acceptedFromIp: acceptanceAudit.acceptedFromIp,
              agreementHash: acceptanceAudit.agreementVersionHash,
              publishedAt: result.data.agreement?.publishedAt || new Date().toISOString(),
            };
            after(async () => {
              try {
                await generateAndDeliverCertificate(certInput);
              } catch (err) {
                console.error("[portal] certificate generation error:", err);
              }
            });
          }
        }
      }

      const eventMap: Record<string, string> = {
        revision_add: "revision_submitted",
        asset_add: "asset_submitted",
        deposit_notice_sent: "deposit_notice_sent",
        design_direction_submit: "design_direction_submitted",
        direction_submit: "direction_submitted",
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

    const decorated = await withInvoices(result, token);
    return NextResponse.json(withRedactedLead(decorated), { status: result.ok ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to update portal" },
      { status: 500 }
    );
  }
}
