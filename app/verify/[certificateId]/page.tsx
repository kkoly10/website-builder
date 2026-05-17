import type { ReactElement } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { headers } from "next/headers";
import {
  enforceRateLimitDurable,
  getIpFromHeaders,
  rateLimitResponse,
} from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Mask an email for public display: keep the first 2 characters of the
// local part + asterisks for the rest + the full domain. "john@example.com"
// → "jo**@example.com". Single-character locals become "j*@example.com".
// Falls back to "—" for missing or malformed input.
function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const at = email.indexOf("@");
  if (at <= 0) return "—";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visible = local.slice(0, 2);
  const masked = "*".repeat(Math.max(1, local.length - 2));
  return `${visible}${masked}@${domain}`;
}

// Date-only on the public verify page. The full timestamp is preserved
// in the agreements table for audit; this page is for "is this real?"
// not "exact moment of signature".
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  // Certificate IDs are unguessable UUIDs, but throttle anyway to keep
  // this from turning into an oracle for "does this ID exist?". Anyone
  // who needs to verify can do so well under the limit; bots get cut.
  const h = await headers();
  const ip = getIpFromHeaders(h);
  const rl = await enforceRateLimitDurable({
    key: `verify:${ip}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    // Returning the JSON 429 from rateLimitResponse works fine here even
    // though this is a server page — Next.js surfaces the response.
    return rateLimitResponse(rl.resetAt) as unknown as ReactElement;
  }

  const { certificateId } = await params;

  // accepted_ip dropped from the public SELECT — kept in the DB for
  // audit, but not surfaced to the public verify page.
  const { data } = await supabaseAdmin
    .from("agreements")
    .select(
      "id, body_hash, published_at, accepted_at, accepted_by_email, status, certificate_path, portal_project_id"
    )
    .eq("id", certificateId)
    .maybeSingle();

  // Fetch lead name via portal_project → quote
  let leadName = "";
  if (data?.portal_project_id) {
    const { data: portal } = await supabaseAdmin
      .from("customer_portal_projects")
      .select("quote_id")
      .eq("id", data.portal_project_id)
      .maybeSingle();
    if (portal?.quote_id) {
      const { data: quote } = await supabaseAdmin
        .from("quotes")
        .select("lead_name")
        .eq("id", portal.quote_id)
        .maybeSingle();
      leadName = quote?.lead_name || "";
    }
  }

  const verified = data?.status === "accepted";
  const bucket = process.env.CERTIFICATES_BUCKET || "certificates";

  let downloadUrl: string | null = null;
  if (data?.certificate_path) {
    const { data: signed } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(data.certificate_path, 60 * 60);
    downloadUrl = signed?.signedUrl ?? null;
  }

  const containerStyle = {
    fontFamily: "'Georgia', serif",
    maxWidth: 680,
    margin: "48px auto",
    padding: "0 24px 80px",
    color: "#1a1a1a",
  } as const;

  if (!data) {
    return (
      <main style={containerStyle}>
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, marginBottom: 12 }}>
            Certificate not found
          </h1>
          <p style={{ color: "#666", fontSize: 15 }}>
            The certificate ID you provided does not match any record in our system.
          </p>
        </div>
      </main>
    );
  }

  const maskedEmail = maskEmail(data.accepted_by_email);

  return (
    <main style={containerStyle}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40, paddingBottom: 32, borderBottom: "2px solid #1a1a1a" }}>
        <div style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "#666", marginBottom: 12 }}>
          CrecyStudio · Web Design & Development
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 400, margin: "0 0 8px" }}>
          Certificate of Completion
        </h1>
        {verified ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "#f0faf4", border: "1px solid #b2dfcc", borderRadius: 20, fontSize: 13, fontWeight: 700, color: "#1a7a4a" }}>
            ✓ Verified
          </div>
        ) : (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "#fef9ec", border: "1px solid #f0d080", borderRadius: 20, fontSize: 13, fontWeight: 700, color: "#8a6000" }}>
            ⚠ Status: {data.status}
          </div>
        )}
      </div>

      {/* Certificate ID */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>Certificate ID</div>
        <div style={{ fontFamily: "monospace", fontSize: 13, background: "#f5f5f5", padding: "8px 12px", borderRadius: 4, border: "1px solid #e0e0e0" }}>
          {data.id}
        </div>
      </section>

      {/* Parties */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        <div style={{ padding: "14px 16px", border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>From (Studio)</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 400, marginBottom: 2 }}>CrecyStudio</div>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#666" }}>hello@crecystudio.com</div>
        </div>
        <div style={{ padding: "14px 16px", border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>To (Client)</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 400, marginBottom: 2 }}>{leadName || "—"}</div>
          {/* Masked: full email kept in DB for audit, public sees first 2 chars only */}
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#666" }}>{maskedEmail}</div>
        </div>
      </section>

      {/* Audit trail — public-safe subset. IP dropped from public view;
         it's preserved in agreements.accepted_ip for the internal audit
         trail. The body_hash + accepted_at give enough proof to verify
         "this signature happened" without leaking signer details. */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", marginBottom: 10 }}>Audit Trail</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", borderBottom: "1px solid #e0e0e0" }}>Event</th>
              <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", borderBottom: "1px solid #e0e0e0" }}>Detail</th>
              <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", borderBottom: "1px solid #e0e0e0" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
              <td style={{ padding: "9px 12px" }}>Agreement published</td>
              <td style={{ padding: "9px 12px", color: "#888" }}>—</td>
              <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12, color: "#555" }}>{fmtDate(data.published_at)}</td>
            </tr>
            <tr>
              <td style={{ padding: "9px 12px" }}>Agreement accepted</td>
              <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12 }}>{maskedEmail}</td>
              <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12, color: "#555" }}>{fmtDate(data.accepted_at)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Document fingerprint — the canonical proof. Anyone can rehash
         the agreement text and compare to this value. Doesn't leak PII. */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>Document Fingerprint (SHA-256)</div>
        <div style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all", background: "#f5f5f5", padding: "8px 12px", borderRadius: 4, border: "1px solid #e0e0e0", color: "#444" }}>
          {data.body_hash || "Not available"}
        </div>
      </section>

      {/* Download */}
      {downloadUrl && (
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <a
            href={downloadUrl}
            style={{ display: "inline-block", background: "#1a1a1a", color: "#fff", padding: "12px 28px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontFamily: "sans-serif" }}
          >
            Download Certificate PDF
          </a>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 20, textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#aaa", fontFamily: "sans-serif", lineHeight: 1.6, margin: 0 }}>
          This document constitutes a valid electronic record under the US ESIGN Act (15 U.S.C. § 7001) and EU eIDAS Regulation (No 910/2014) as a Simple Electronic Signature.
          <br />
          Verified by CrecyStudio · <a href="https://crecystudio.com" style={{ color: "#aaa" }}>crecystudio.com</a>
        </p>
      </div>
    </main>
  );
}
