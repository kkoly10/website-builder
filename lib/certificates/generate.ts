import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendResendEmail } from "@/lib/resend";
import { sendEventNotification } from "@/lib/notifications";
import { AgreementDocument } from "@/lib/certificates/AgreementDocument";
import { CertificateDocument } from "@/lib/certificates/CertificateDocument";
import { emailWrap, ctaButton, sig, escHtml } from "@/lib/emailHelpers";

export type GenerateCertInput = {
  agreementId: string;
  quoteId: string;
  leadName: string;
  leadEmail: string;
  agreementText: string;
  acceptedAt: string;
  acceptedByEmail: string | null;
  acceptedFromIp: string | null;
  agreementHash: string | null;
  publishedAt: string;
};

const BUCKET = () => process.env.CERTIFICATES_BUCKET || "certificates";

async function mergePdfs(a: Buffer, b: Buffer): Promise<Buffer> {
  const [aDoc, bDoc] = await Promise.all([PDFDocument.load(a), PDFDocument.load(b)]);
  const merged = await PDFDocument.create();
  const aPages = await merged.copyPages(aDoc, Array.from({ length: aDoc.getPageCount() }, (_, i) => i));
  const bPages = await merged.copyPages(bDoc, Array.from({ length: bDoc.getPageCount() }, (_, i) => i));
  [...aPages, ...bPages].forEach((p) => merged.addPage(p));
  return Buffer.from(await merged.save());
}

function buildEmailHtml(leadName: string, signedUrl: string, verificationUrl: string): string {
  const safeName = escHtml(leadName || "there");
  const safeVerifyUrl = escHtml(verificationUrl);
  return emailWrap(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.02em">Your signed agreement, ${safeName}.</h1>
    <p style="margin:0 0 28px;font-size:13px;color:#888888;letter-spacing:0.06em;text-transform:uppercase">Certificate of Completion enclosed</p>
    <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7">Thank you for accepting the project agreement. Your signed copy and Certificate of Completion are attached as a single PDF — keep it somewhere safe for your records.</p>
    <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.7">You can re-download or independently verify the certificate at any time using the links below.</p>
    ${ctaButton(signedUrl, "Download certificate")}
    <p style="margin:0 0 8px;font-size:13px;color:#888888;line-height:1.6;letter-spacing:0.04em;text-transform:uppercase;font-weight:600">Independent verification</p>
    <p style="margin:0 0 28px;font-size:13px;color:#444444;line-height:1.6;word-break:break-all"><a href="${safeVerifyUrl}" style="color:#111111;text-decoration:underline">${safeVerifyUrl}</a></p>
    ${sig()}
  `, "Reply to this email to reach Komlan directly.", "Your signed agreement and Certificate of Completion are attached.");
}

export async function generateAndDeliverCertificate(
  input: GenerateCertInput
): Promise<{ certificatePath: string }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const verificationUrl = `${siteUrl}/verify/${input.agreementId}`;

  // 1. QR code
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: "H",
    width: 300,
    margin: 1,
  });

  // 2. Render both PDFs in parallel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toEl = (el: React.ReactElement): React.ReactElement<any> => el as React.ReactElement<any>;
  const [agreementBytes, certBytes] = await Promise.all([
    renderToBuffer(
      toEl(React.createElement(AgreementDocument, {
        text: input.agreementText,
        leadName: input.leadName,
      }))
    ),
    renderToBuffer(
      toEl(React.createElement(CertificateDocument, {
        certificateId: input.agreementId,
        leadName: input.leadName,
        leadEmail: input.leadEmail,
        acceptedAt: input.acceptedAt,
        acceptedByEmail: input.acceptedByEmail,
        acceptedFromIp: input.acceptedFromIp,
        agreementHash: input.agreementHash,
        publishedAt: input.publishedAt,
        verificationUrl,
        qrDataUrl,
      }))
    ),
  ]);

  // 3. Merge: agreement pages first, certificate last
  const mergedBuffer = await mergePdfs(agreementBytes, certBytes);

  // 4. Compute the target version and write to a versioned path.
  // certificate_version is the LATEST version actually written; the
  // first generation writes to v1 (default), regenerations bump to
  // v2, v3, etc. Replaces the previous `upsert: true` which silently
  // destroyed prior signed PDFs.
  const { data: existingAgreement, error: readErr } = await supabaseAdmin
    .from("agreements")
    .select("certificate_path, certificate_version")
    .eq("id", input.agreementId)
    .maybeSingle();
  if (readErr || !existingAgreement) {
    throw new Error(`Agreement not found for cert generation: ${input.agreementId}`);
  }
  const currentVersion = Number(existingAgreement.certificate_version || 1);
  const targetVersion = existingAgreement.certificate_path
    ? currentVersion + 1
    : currentVersion;
  let certPath = `${input.agreementId}/certificate-v${targetVersion}.pdf`;

  let upload = await supabaseAdmin.storage
    .from(BUCKET())
    .upload(certPath, mergedBuffer, { contentType: "application/pdf", upsert: false });
  let chosenVersion = targetVersion;

  if (upload.error && /already exists/i.test(upload.error.message)) {
    // Lost a race to a concurrent regeneration at the same version.
    // Bump and retry once. Two simultaneous regens shouldn't be common
    // but the unique storage path protects us either way.
    chosenVersion = targetVersion + 1;
    certPath = `${input.agreementId}/certificate-v${chosenVersion}.pdf`;
    upload = await supabaseAdmin.storage
      .from(BUCKET())
      .upload(certPath, mergedBuffer, { contentType: "application/pdf", upsert: false });
  }
  if (upload.error) {
    throw new Error(`Certificate upload failed: ${upload.error.message}`);
  }

  // 5. Update agreement row to point at the new versioned path.
  await supabaseAdmin
    .from("agreements")
    .update({ certificate_path: certPath, certificate_version: chosenVersion })
    .eq("id", input.agreementId);

  return finishCertDelivery(input, certPath, mergedBuffer, verificationUrl, siteUrl);
}

// Email delivery + admin notification path. Extracted so the upload-
// retry branch above can reuse it without duplicating the email logic.
// Also writes certificate_delivery_status so a failed Resend call
// leaves an actionable flag instead of silently completing the accept.
async function finishCertDelivery(
  input: GenerateCertInput,
  certPath: string,
  mergedBuffer: Buffer,
  verificationUrl: string,
  siteUrl: string,
): Promise<{ certificatePath: string }> {
  // Signed URL for email link (30 days)
  const { data: signedData } = await supabaseAdmin.storage
    .from(BUCKET())
    .createSignedUrl(certPath, 60 * 60 * 24 * 30);

  const signedUrl = signedData?.signedUrl ?? `${siteUrl}/verify/${input.agreementId}`;

  // Validate recipient before attempting send. lib/notifications.ts has
  // an equivalent trim+@ check (PR 3 fix); the cert path was missing
  // it, so a lead with leadEmail="" or "n/a" would silently fail at
  // the Resend API and the delivery_status would flip to 'failed'
  // without admin knowing the leadEmail itself was the problem.
  // Flag explicitly so the error message says "fix the lead email"
  // instead of generic "Resend rejected".
  const recipient = (input.leadEmail || "").trim();
  if (!recipient || !recipient.includes("@")) {
    await supabaseAdmin
      .from("agreements")
      .update({ certificate_delivery_status: "failed" })
      .eq("id", input.agreementId);
    throw new Error(`Certificate email failed: invalid leadEmail "${input.leadEmail}".`);
  }

  // Email client with PDF attachment. On failure, flag the row as
  // failed so an admin can re-trigger via the regenerate endpoint
  // (PR 4's ?force=true flag).
  try {
    await sendResendEmail({
      to: recipient,
      from: process.env.NOTIFICATION_FROM_EMAIL || "studio@crecystudio.com",
      subject: "Your signed project agreement — CrecyStudio",
      html: buildEmailHtml(input.leadName, signedUrl, verificationUrl),
      attachments: [
        {
          filename: "CrecyStudio-Agreement-Certificate.pdf",
          content: mergedBuffer,
          content_type: "application/pdf",
        },
      ],
    });
    await supabaseAdmin
      .from("agreements")
      .update({ certificate_delivery_status: "sent" })
      .eq("id", input.agreementId);
  } catch (emailErr) {
    console.error("[certificates] client email failed:", emailErr);
    await supabaseAdmin
      .from("agreements")
      .update({ certificate_delivery_status: "failed" })
      .eq("id", input.agreementId);
    // Don't re-throw — the certificate file is uploaded and the
    // delivery_status flag gives admin a clean re-trigger surface.
  }

  // Notify admin (fire-and-forget, no PDF needed)
  sendEventNotification({
    event: "agreement_accepted",
    quoteId: input.quoteId,
    leadName: input.leadName,
    leadEmail: input.leadEmail,
    workspaceUrl: `${siteUrl}/internal/admin/${input.quoteId}`,
  }).catch((err) => console.error("[certificates] admin notification error:", err));

  return { certificatePath: certPath };
}
