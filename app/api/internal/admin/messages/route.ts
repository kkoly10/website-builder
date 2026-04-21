import { NextRequest, NextResponse } from "next/server";
import {
  createCustomerPortalMessageByQuoteId,
  getCustomerPortalViewByQuoteId,
  listCustomerPortalMessageConversations,
} from "@/lib/customerPortal";
import { sendPortalMessageNotification } from "@/lib/messaging/notify";
import { requireAdminRoute } from "@/lib/routeAuth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

function sanitizeFilename(name: string) {
  return (name || "file")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 160);
}

function normalizeSenderRole(value: unknown): "studio" | "internal" {
  return String(value ?? "").trim().toLowerCase() === "internal" ? "internal" : "studio";
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

function summarizeMessages(messages: Array<{
  senderRole: "client" | "studio" | "internal";
  body: string;
  readAt: string | null;
  createdAt: string;
  attachment: { name: string | null } | null;
}>) {
  const lastMessage = messages[messages.length - 1];
  return {
    unreadCount: messages.filter((message) => message.senderRole === "client" && !message.readAt)
      .length,
    lastMessagePreview:
      lastMessage?.body ||
      (lastMessage?.attachment?.name ? `Attachment: ${lastMessage.attachment.name}` : ""),
    lastMessageAt: lastMessage?.createdAt || "",
    lastMessageRole: lastMessage?.senderRole || null,
  };
}

async function uploadAttachment(
  quoteId: string,
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
  const storagePath = `${quoteId}/messages/${Date.now()}_${safeName}`;

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

async function getAdminSenderName() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const candidate =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email;

  return fallbackAdminName(candidate);
}

export async function GET(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  try {
    const quoteId = String(req.nextUrl.searchParams.get("quoteId") || "").trim();
    const conversations = await listCustomerPortalMessageConversations();

    if (!quoteId) {
      return NextResponse.json({ ok: true, conversations });
    }

    const result = await getCustomerPortalViewByQuoteId(quoteId, {
      includeInternal: true,
      markReadAs: "studio",
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || "Conversation not found." },
        { status: 404 }
      );
    }

    const summary = {
      ...(conversations.find((conversation) => conversation.quoteId === quoteId) ?? {
        quoteId,
      }),
      ...summarizeMessages(result.data.messages),
    };

    return NextResponse.json({
      ok: true,
      conversations,
      conversation: {
        quoteId,
        summary,
        messages: result.data.messages,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load conversations." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdminRoute();
  if (authErr) return authErr;

  try {
    const contentType = req.headers.get("content-type") || "";
    const senderName = await getAdminSenderName();
    let form: FormData | null = null;
    let quoteId = "";
    let body = "";
    let senderRole: "studio" | "internal" = "studio";
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
      form = await req.formData();
      quoteId = String(form.get("quoteId") || "").trim();
      body = String(form.get("body") || "").trim();
      senderRole = normalizeSenderRole(form.get("senderRole"));
    } else {
      const payload = await req.json();
      quoteId = String(payload?.quoteId || "").trim();
      body = String(payload?.body || "").trim();
      senderRole = normalizeSenderRole(payload?.senderRole);
    }

    if (!quoteId) {
      return NextResponse.json(
        { ok: false, error: "quoteId is required." },
        { status: 400 }
      );
    }

    if (form) {
      const maybeFile = form.get("file");
      if (maybeFile instanceof File) {
        attachment = await uploadAttachment(quoteId, maybeFile);
      }
    }

    const message = await createCustomerPortalMessageByQuoteId({
      quoteId,
      senderRole,
      senderName: senderRole === "internal" ? senderName : "CrecyStudio",
      body,
      ...attachment,
    });

    const result = await getCustomerPortalViewByQuoteId(quoteId, {
      includeInternal: true,
    });

    if (senderRole === "studio" && result.ok) {
      sendPortalMessageNotification({
        senderRole,
        senderName: "CrecyStudio",
        body,
        quoteId,
        portalToken: result.data.quote.publicToken,
        leadName: result.data.lead.name,
        leadEmail: result.data.lead.email,
        attachmentName: attachment?.attachmentName || null,
      }).catch((err) => {
        console.error("[admin/messages] notification error:", err);
      });
    }

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
