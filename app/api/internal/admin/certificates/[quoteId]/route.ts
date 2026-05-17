import { NextRequest, NextResponse } from "next/server";
import { requireAdminRoute, enforceAdminRateLimit } from "@/lib/routeAuth";
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

  const { data: agr } = await supabaseAdmin
    .from("agreements")
    .select("id, certificate_path, accepted_at, accepted_by_email, accepted_ip, body_text, body_hash, published_at, status")
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
  const rlErr = await enforceAdminRateLimit(req, { keyPrefix: "admin-certificates", limit: 60 });
  if (rlErr) return rlErr;

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
  const rlErr = await enforceAdminRateLimit(req, { keyPrefix: "admin-certificates", limit: 30 });
  if (rlErr) return rlErr;

  const { quoteId } = await Promise.resolve(ctx.params);

  const agr = await getAgreementForQuote(quoteId);
  if (!agr) {
    return NextResponse.json(
      { ok: false, error: "No accepted agreement found for this project." },
      { status: 404 }
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

  const bucket = process.env.CERTIFICATES_BUCKET || "certificates";
  const certPath = `${agr.id}/certificate.pdf`;
  const { data: signed } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(certPath, 60 * 60);

  return NextResponse.json({ ok: true, signedUrl: signed?.signedUrl ?? null });
}
