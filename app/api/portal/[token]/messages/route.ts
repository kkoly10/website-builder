import { NextRequest, NextResponse } from "next/server";
import {
  createCustomerPortalMessageByToken,
  getCustomerPortalBundleByToken,
  getCustomerPortalViewByToken,
} from "@/lib/customerPortal";
import { sendPortalMessageNotification } from "@/lib/messaging/notify";
import {
  enforceRateLimitDurable,
  getIpFromHeaders,
  rateLimitResponse,
} from "@/lib/rateLimit";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MESSAGE_BUCKET =
  process.env.PORTAL_MESSAGES_BUCKET || process.env.PORTAL_ASSETS_BUCKET || "portal-assets";
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "video/mp4",
  "video/quicktime",
  "application/zip",
]);

async function getParams(
  ctx: { params: Promise<{ token: string }> | { token: string } }
) {
  return await Promise.resolve(ctx.params);
}

function sanitizeFilename(name: string) {
  return (name || "file")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 160);
}

function normalizeSenderRole(value: unknown): "client" | "studio" | "internal" {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "studio" || normalized === "internal") return normalized;
  return "client";
}

function fallbackAdminName(email?: string | null) {
  const normalized = String(email || "").trim();
  if (!normalized.includes("@")) return normalized || "CrecyStudio";
  const local = normalized.split("@")[0].replace(/[._-]+/g, " ").trim();
  return local
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

async function uploadAttachment(
  portalProjectId: string,
  file: File
) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.`);
  }

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`File type "${mimeType}" is not allowed.`);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = sanitizeFilename(file.name || "upload.bin");
  const storagePath = `${portalProjectId}/messages/${Date.now()}_${safeName}`;

  const upload = await supabaseAdmin.storage.from(MESSAGE_BUCKET).upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (upload.error) {
    throw new Error(
      upload.error.message ||
        `Storage upload failed. Make sure bucket "${MESSAGE_BUCKET}" exists.`
    );
  }

  return {
    attachmentName: file.name || safeName,
    attachmentType: mimeType,
    attachmentSize: file.size || null,
    attachmentStorageBucket: MESSAGE_BUCKET,
    attachmentStoragePath: storagePath,
  };
}

async function getOptionalAdminIdentity() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const admin = await isAdminUser({
      userId: user?.id ?? null,
      email: user?.email ?? null,
    });

    if (!admin) return null;

    return {
      email: user?.email ?? null,
      senderName:
        fallbackAdminName(
          (user?.user_metadata?.full_name as string | undefined) ||
            (user?.user_metadata?.name as string | undefined) ||
            user?.email
        ) || "CrecyStudio",
    };
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const { token } = await getParams(ctx);
    const result = await getCustomerPortalViewByToken(token, { markReadAs: "client" });

    if (!result.ok) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json({ ok: true, messages: result.data.messages });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load messages." },
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
    const rl = await enforceRateLimitDurable({
      key: `portal-messages:${ip}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

    const { token } = await getParams(ctx);
    const bundle = await getCustomerPortalBundleByToken(token);

    if (!bundle?.portal?.id) {
      return NextResponse.json({ ok: false, error: "Portal not found." }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";
    const adminIdentity = await getOptionalAdminIdentity();
    let senderRole: "client" | "studio" | "internal" = "client";
    let body = "";
    let attachment:
      | {
          attachmentName?: string | null;
          attachmentType?: string | null;
          attachmentSize?: number | null;
          attachmentStorageBucket?: string | null;
          attachmentStoragePath?: string | null;
        }
      | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      senderRole = normalizeSenderRole(form.get("senderRole"));
      body = String(form.get("body") || "").trim();
      const maybeFile = form.get("file");

      if (maybeFile instanceof File) {
        attachment = await uploadAttachment(String(bundle.portal.id), maybeFile);
      }
    } else {
      const payload = await req.json();
      senderRole = normalizeSenderRole(payload?.senderRole);
      body = String(payload?.body || "").trim();
    }

    if (senderRole !== "client" && !adminIdentity) {
      return NextResponse.json(
        { ok: false, error: "Admin authentication is required for studio messages." },
        { status: 401 }
      );
    }

    const senderName =
      senderRole === "client"
        ? String(bundle.lead?.name || "").trim() || "Client"
        : senderRole === "internal"
        ? adminIdentity?.senderName || "Internal note"
        : "CrecyStudio";

    const message = await createCustomerPortalMessageByToken({
      token,
      senderRole,
      senderName,
      body,
      ...attachment,
    });

    if (senderRole !== "internal") {
      sendPortalMessageNotification({
        senderRole,
        senderName,
        body,
        quoteId: String(bundle.quote?.id || ""),
        portalToken: token,
        leadName: String(bundle.lead?.name || ""),
        leadEmail: String(bundle.lead?.email || ""),
        attachmentName: attachment?.attachmentName || null,
      }).catch((err) => {
        console.error("[portal/messages] notification error:", err);
      });
    }

    const result = await getCustomerPortalViewByToken(token, {
      includeInternal: senderRole !== "client" && !!adminIdentity,
    });

    return NextResponse.json({
      ok: true,
      message,
      messages: result.ok ? result.data.messages : [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to send message." },
      { status: 500 }
    );
  }
}
