import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/routeAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateAndDeliverCertificate } from "@/lib/certificates/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAgreementForQuote(quoteId: string) {
  // Resolve portal_project_id from quoteId via customer_portal_projects
  const { data: portal } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("id")
    .eq("quote_id", quoteId)
    .maybeSingle();

  if (!portal?.id) return null;

  // certificate_version + certificate_delivery_status added in
  // 20260518_agreements_idempotency.sql. The POST handler below uses
  // both to gate regeneration and clear the delivery flag on retry.
  const { data: agr } = await supabaseAdmin
    .from("agreements")
    .select(
      "id, certificate_path, certificate_version, certificate_delivery_status, accepted_at, accepted_by_email, accepted_ip, body_text, body_hash, published_at, status"
    )
    .eq("portal_project_id", portal.id)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return agr ?? null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ quoteId: string }> | { quoteId: string } }
) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  const { quoteId } = await Promise.resolve(ctx.params);
  const agr = await getAgreementForQuote(quoteId);

  if (!agr?.certificate_path) {
    return NextResponse.json({ ok: true, hasCertificate: false });
  }

  const bucket = process.env.CERTIFICATES_BUCKET || "certificates";
  const { data: signed } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(agr.certificate_path, 60 * 60); // 1 hour

  return NextResponse.json({
    ok: true,
    hasCertificate: true,
    agreementId: agr.id,
    signedUrl: signed?.signedUrl ?? null,
  });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ quoteId: string }> | { quoteId: string } }
) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  const { quoteId } = await Promise.resolve(ctx.params);

  // ?force=true bypasses the idempotency guard below. Without it, this
  // handler refuses to regenerate a certificate that's already been
  // delivered — admin double-click protection. With it, the lib's
  // versioned path logic bumps to v+1 so the prior PDF stays available
  // for the original signed download link.
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  const agr = await getAgreementForQuote(quoteId);
  if (!agr) {
    return NextResponse.json(
      { ok: false, error: "No accepted agreement found for this project." },
      { status: 404 }
    );
  }

  // Idempotency guard. If a certificate is already generated AND
  // delivered successfully, refuse the regen unless ?force=true. This
  // is the protection against accidental admin double-click triggering
  // a second email to the client (each regen sends a fresh PDF email).
  // certificate_delivery_status='failed' is allowed through without
  // force so the original failure can be retried.
  if (
    !force &&
    agr.certificate_path &&
    agr.certificate_delivery_status === "sent"
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Certificate already generated and delivered. Pass ?force=true to regenerate (bumps version, re-emails client).",
        existing: {
          agreementId: agr.id,
          certificatePath: agr.certificate_path,
          certificateVersion: agr.certificate_version ?? 1,
          deliveryStatus: agr.certificate_delivery_status,
        },
      },
      { status: 409 }
    );
  }

  // Fetch lead info from quote
  const { data: quote } = await supabaseAdmin
    .from("quotes")
    .select("id, lead_name, lead_email")
    .eq("id", quoteId)
    .maybeSingle();

  if (!quote?.lead_email) {
    return NextResponse.json(
      { ok: false, error: "Lead email not found." },
      { status: 400 }
    );
  }

  try {
    await generateAndDeliverCertificate({
      agreementId: agr.id,
      quoteId,
      leadName: quote.lead_name || "",
      leadEmail: quote.lead_email,
      agreementText: agr.body_text,
      acceptedAt: agr.accepted_at || new Date().toISOString(),
      acceptedByEmail: agr.accepted_by_email,
      acceptedFromIp: agr.accepted_ip,
      agreementHash: agr.body_hash || null,
      publishedAt: agr.published_at || new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Certificate generation failed." },
      { status: 500 }
    );
  }

  // Re-read the agreement so we have the freshly-written certificate_path
  // (the lib bumps to v+1 on regen — the path we computed before the
  // call would be stale).
  const updated = await getAgreementForQuote(quoteId);
  const certPath = updated?.certificate_path || agr.certificate_path;
  if (!certPath) {
    return NextResponse.json(
      { ok: false, error: "Certificate path missing after generation." },
      { status: 500 }
    );
  }
  const bucket = process.env.CERTIFICATES_BUCKET || "certificates";
  const { data: signed } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(certPath, 60 * 60);

  return NextResponse.json({
    ok: true,
    signedUrl: signed?.signedUrl ?? null,
    certificateVersion: updated?.certificate_version ?? agr.certificate_version ?? 1,
    deliveryStatus: updated?.certificate_delivery_status ?? "pending",
  });
}
