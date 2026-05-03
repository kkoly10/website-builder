import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendResendEmail } from "@/lib/resend";
import { sendEventNotification } from "@/lib/notifications";
import { AgreementDocument } from "@/lib/certificates/AgreementDocument";
import { CertificateDocument } from "@/lib/certificates/CertificateDocument";

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
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h2 style="font-size:20px;margin-bottom:8px">Your signed project agreement</h2>
      <p>Hi ${leadName},</p>
      <p>Thank you for accepting the project agreement with CrecyStudio. Your Certificate of Completion is attached to this email as a PDF.</p>
      <p>You can also download it or verify it online at any time:</p>
      <p style="margin:16px 0">
        <a href="${signedUrl}" style="background:#1a1a1a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">Download Certificate</a>
      </p>
      <p style="font-size:13px;color:#666">
        Verify this certificate: <a href="${verificationUrl}" style="color:#1a1a1a">${verificationUrl}</a>
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#999">CrecyStudio · Web Design &amp; Development</p>
    </div>
  `;
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
