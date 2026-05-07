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

  // 4. Upload to Supabase Storage
  const certPath = `${input.agreementId}/certificate.pdf`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET())
    .upload(certPath, mergedBuffer, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw new Error(`Certificate upload failed: ${uploadError.message}`);

  // 5. Store path in agreements table
  await supabaseAdmin
    .from("agreements")
    .update({ certificate_path: certPath })
    .eq("id", input.agreementId);

  // 6. Signed URL for email link (30 days)
  const { data: signedData } = await supabaseAdmin.storage
    .from(BUCKET())
    .createSignedUrl(certPath, 60 * 60 * 24 * 30);

  const signedUrl = signedData?.signedUrl ?? `${siteUrl}/verify/${input.agreementId}`;

  // 7. Email client with PDF attachment
  await sendResendEmail({
    to: input.leadEmail,
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

  // 8. Notify admin (fire-and-forget, no PDF needed)
  sendEventNotification({
    event: "agreement_accepted",
    quoteId: input.quoteId,
    leadName: input.leadName,
    leadEmail: input.leadEmail,
    workspaceUrl: `${siteUrl}/internal/admin/${input.quoteId}`,
  }).catch((err) => console.error("[certificates] admin notification error:", err));

  return { certificatePath: certPath };
}
