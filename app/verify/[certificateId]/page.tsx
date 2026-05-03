import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
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
  const { certificateId } = await params;

  const { data } = await supabaseAdmin
    .from("agreements")
    .select(
      "id, body_hash, published_at, accepted_at, accepted_by_email, accepted_ip, status, certificate_path, portal_project_id"
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
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#666" }}>{data.accepted_by_email || "—"}</div>
        </div>
      </section>

      {/* Audit trail */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", marginBottom: 10 }}>Audit Trail</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", borderBottom: "1px solid #e0e0e0" }}>Event</th>
              <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", borderBottom: "1px solid #e0e0e0" }}>Detail</th>
              <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", borderBottom: "1px solid #e0e0e0" }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
              <td style={{ padding: "9px 12px" }}>Agreement published</td>
              <td style={{ padding: "9px 12px", color: "#888" }}>—</td>
              <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12, color: "#555" }}>{fmt(data.published_at)}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
              <td style={{ padding: "9px 12px" }}>Agreement accepted</td>
              <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12 }}>{data.accepted_by_email || "—"}</td>
              <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12, color: "#555" }}>{fmt(data.accepted_at)}</td>
            </tr>
            <tr>
              <td style={{ padding: "9px 12px" }}>IP address</td>
              <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12 }}>{data.accepted_ip || "Not recorded"}</td>
              <td style={{ padding: "9px 12px", color: "#888" }}>—</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Document fingerprint */}
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
