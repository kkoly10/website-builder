import { NextRequest, NextResponse } from "next/server";
import {
  getCustomerPortalBundleByToken,
  submitAssetByPortalToken,
} from "@/lib/customerPortal";
import { sendEventNotification } from "@/lib/notifications";
import {
  enforceRateLimitDurable,
  getIpFromHeaders,
  rateLimitResponse,
} from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASSET_BUCKET = process.env.PORTAL_ASSETS_BUCKET || "portal-assets";
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

function sanitizeExternalUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function getNotificationContext(token: string) {
  const bundle = await getCustomerPortalBundleByToken(token);
  if (!bundle?.quote) return null;

  return {
    event: "asset_submitted",
    quoteId: String(bundle.quote.id || ""),
    leadName: String(bundle.lead?.name || ""),
    leadEmail: String(bundle.lead?.email || ""),
    workspaceUrl: token ? `/portal/${token}` : undefined,
  } as const;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";
    const bundle = await getCustomerPortalBundleByToken(token);

    if (!bundle) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired portal token." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, assets: bundle.assets ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIpFromHeaders(req.headers);
    const rl = await enforceRateLimitDurable({
      key: `portal-assets:${ip}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const token = String(body?.token || "");
      const safeUrl = sanitizeExternalUrl(body?.url);

      if (!token) {
        return NextResponse.json(
          { ok: false, error: "Portal token is required." },
          { status: 400 }
        );
      }

      if (token === "demo") {
        return NextResponse.json(
          { ok: false, error: "This is a read-only demo workspace. No changes can be saved." },
          { status: 403 }
        );
      }

      if (!safeUrl) {
        return NextResponse.json(
          { ok: false, error: "Asset URL must be a valid http or https link." },
          { status: 400 }
        );
      }

      const asset = await submitAssetByPortalToken({
        token,
        assetType: String(body?.assetType || "general"),
        label: String(body?.label || "Client link"),
        assetUrl: safeUrl,
        notes: String(body?.notes || ""),
      });

      const notificationCtx = await getNotificationContext(token);
      if (notificationCtx) {
        sendEventNotification(notificationCtx).catch((err) => {
          console.error("[portal/assets] notification error:", err);
        });
      }

      return NextResponse.json({ ok: true, asset });
    }

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const token = String(form.get("token") || "");

      if (!token) {
        return NextResponse.json(
          { ok: false, error: "Portal token is required." },
          { status: 400 }
        );
      }

      if (token === "demo") {
        return NextResponse.json(
          { ok: false, error: "This is a read-only demo workspace. No changes can be saved." },
          { status: 403 }
        );
      }

      const maybeFile = form.get("file");
      if (!maybeFile || !(maybeFile instanceof File)) {
        return NextResponse.json(
          { ok: false, error: "No file received." },
          { status: 400 }
        );
      }

      if (maybeFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            ok: false,
            error: `File too large. Maximum size is ${
              MAX_FILE_SIZE / 1024 / 1024
            } MB.`,
          },
          { status: 400 }
        );
      }

      const mimeType = maybeFile.type || "application/octet-stream";
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return NextResponse.json(
          { ok: false, error: `File type "${mimeType}" is not allowed.` },
          { status: 400 }
        );
      }

      const bundle = await getCustomerPortalBundleByToken(token);
      if (!bundle?.portal?.id) {
        return NextResponse.json(
          { ok: false, error: "Invalid or expired portal token." },
          { status: 404 }
        );
      }

      const bytes = await maybeFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = sanitizeFilename(maybeFile.name || "upload.bin");
      const storagePath = `${bundle.portal.id}/${Date.now()}_${safeName}`;

      const upload = await bundleStorageUpload(storagePath, buffer, mimeType);
      if (!upload.ok) {
        return NextResponse.json(
          { ok: false, error: upload.error },
          { status: 500 }
        );
      }

      const asset = await submitAssetByPortalToken({
        token,
        source: "portal_file",
        assetType: String(form.get("assetType") || "file"),
        label: String(form.get("label") || maybeFile.name || "Client file"),
        notes: String(form.get("notes") || ""),
        status: "submitted",
        storageBucket: ASSET_BUCKET,
        storagePath,
        fileName: maybeFile.name || safeName,
        mimeType,
        fileSize: maybeFile.size || null,
      });

      const notificationCtx = await getNotificationContext(token);
      if (notificationCtx) {
        sendEventNotification(notificationCtx).catch((err) => {
          console.error("[portal/assets] notification error:", err);
        });
      }

      return NextResponse.json({ ok: true, asset });
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported content type." },
      { status: 415 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

async function bundleStorageUpload(
  storagePath: string,
  buffer: Buffer,
  mimeType: string
) {
  const upload = await supabaseAdmin.storage.from(ASSET_BUCKET).upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (upload.error) {
    return {
      ok: false as const,
      error:
        upload.error.message ||
        `Storage upload failed. Make sure bucket "${ASSET_BUCKET}" exists.`,
    };
  }

  return { ok: true as const };
}
