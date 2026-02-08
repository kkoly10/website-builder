import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { sendResendEmail } from "../../../lib/resend";
import { evaluatePIE, ProjectInput } from "../../../lib/pie";

export const dynamic = "force-dynamic";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toProjectInput(intake: any): ProjectInput {
  // Map your current intake → PIE input.
  // We can refine this once your questionnaire becomes more sophisticated.
  return {
    pages: intake.pages ?? "4-5",
    booking: intake.booking ? "external" : "none",
    payments: intake.payments ? "link" : "none",
    automation: "none",
    integrations: "none",
    content: "partial",
    stakeholders: "1",
    timeline:
      intake.timeline === "Under 14 days"
        ? "under-14"
        : intake.timeline === "2-3 weeks"
        ? "2-3 weeks"
        : "4+ weeks",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const leadEmail = String(body.leadEmail || "").trim();
    const leadPhone = body.leadPhone ? String(body.leadPhone).trim() : null;
    const intake = body.intake ?? {};
    const clientEstimate = Number(body.clientEstimate || 0);

    if (!leadEmail) {
      return NextResponse.json({ error: "leadEmail is required" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // Compute PIE report server-side (authoritative)
    const pieInput = toProjectInput(intake);
    const report = evaluatePIE(pieInput);

    // Insert project
    const { data: project, error: projectErr } = await admin
      .from("projects")
      .insert([
        {
          lead_email: leadEmail,
          lead_phone: leadPhone,
          intake,
          client_estimate: clientEstimate,
          tier_recommended: report.tier,
          confidence: report.confidence,
          score: report.score,
          status: "new",
        },
      ])
      .select("id")
      .single();

    if (projectErr) throw projectErr;

    // Token + expiry
    const token = crypto.randomUUID();
    const expiresAt = addDays(new Date(), 30).toISOString();

    const { error: pieErr } = await admin.from("pie_reports").insert([
      {
        token,
        project_id: project.id,
        report,
        expires_at: expiresAt,
      },
    ]);

    if (pieErr) throw pieErr;

    // Email alert
    const from = process.env.RESEND_FROM_EMAIL || "alerts@mail.crecystudio.com";
    const to = process.env.ALERT_TO_EMAIL || "";
    const baseUrl = process.env.APP_BASE_URL || "";
    const internalUrl = `${baseUrl}/internal/preview?token=${token}`;

    if (to && baseUrl) {
      const subject = `🧠 New Website Lead — PIE Report Ready (${report.tier}, ${report.score}/100)`;

      const html = `
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.5">
          <h2>New Lead Submitted</h2>
          <p><strong>Email:</strong> ${leadEmail}</p>
          ${leadPhone ? `<p><strong>Phone:</strong> ${leadPhone}</p>` : ""}
          <p><strong>Client Estimate Shown:</strong> $${clientEstimate}</p>

          <hr />

          <h3>PIE Summary</h3>
          <p><strong>Tier:</strong> ${report.tier} (${report.confidence})</p>
          <p><strong>Complexity:</strong> ${report.score}/100</p>
          <p><strong>Internal Target:</strong> $${report.pricing.target} &nbsp; | &nbsp; <strong>Minimum:</strong> $${report.pricing.minimum}</p>

          <p style="margin-top:16px;">
            <a href="${internalUrl}" style="display:inline-block;padding:12px 16px;background:#000;color:#fff;text-decoration:none;border-radius:10px">
              View Internal PIE Report →
            </a>
          </p>

          <p style="color:#666;margin-top:10px;font-size:13px;">
            Link expires in 30 days: ${expiresAt}
          </p>
        </div>
      `;

      await sendResendEmail({ to, from, subject, html });
    }

    return NextResponse.json({ ok: true, token, projectId: project.id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}