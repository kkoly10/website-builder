import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> | { token: string } }
) {
  const { token } = await Promise.resolve(ctx.params);

  const { data: portalRow } = await supabaseAdmin
    .from("customer_portal_projects")
    .select("id")
    .eq("access_token", token)
    .maybeSingle();

  if (!portalRow?.id) {
    return NextResponse.json({ ok: false, error: "Portal not found." }, { status: 404 });
  }

  const { data: agrRow } = await supabaseAdmin
    .from("agreements")
    .select("certificate_path")
    .eq("portal_project_id", portalRow.id)
    .eq("status", "accepted")
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!agrRow?.certificate_path) {
    return NextResponse.json(
      { ok: false, error: "Certificate not available yet." },
      { status: 404 }
    );
  }

  const bucket = process.env.CERTIFICATES_BUCKET || "certificates";
  // 60-second TTL is the tightest reasonable window for a click-to-
  // download flow. The signed URL ends up in CDN / proxy access logs;
  // the shorter the window, the smaller the replay surface.
  const { data: signed } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(agrRow.certificate_path, 60);

  if (!signed?.signedUrl) {
    return NextResponse.json(
      { ok: false, error: "Unable to generate download link." },
      { status: 500 }
    );
  }

  // no-store keeps the redirect itself out of intermediate caches.
  // no-referrer prevents the signed URL leaking through the next hop's
  // Referer header when the browser follows the 302.
  const res = NextResponse.redirect(signed.signedUrl, { status: 302 });
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
