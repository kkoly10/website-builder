// app/api/portal/assets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolvePortalAccess } from "@/lib/portalAccess";
import { sendEventNotification } from "@/lib/notifications";
import { enforceRateLimit, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASSET_BUCKET = process.env.PORTAL_ASSETS_BUCKET || "portal-assets";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

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

type PortalMilestone = {
  key: string;
  label: string;
  done: boolean;
  updatedAt?: string | null;
};

function sanitizeFilename(name: string) {
  return (name || "file")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 160);
}

function setMilestoneDone(
  milestones: PortalMilestone[],
  key: string,
  label: string,
  done: boolean
): PortalMilestone[] {
  const now = new Date().toISOString();
  const found = milestones.some((m) => m.key === key);

  if (!found) {
    return [...milestones, { key, label, done, updatedAt: now }];
  }

  return milestones.map((m) =>
    m.key === key ? { ...m, label: m.label || label, done, updatedAt: now } : m
  );
}

async function listAssetsForQuote(quoteId: string) {
  const { data, error } = await supabaseAdmin
    .from("portal_assets")
    .select("*")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = await Promise.all(
    (data ?? []).map(async (row: any) => {
      let signedUrl: string | null = null;

      if (row.storage_bucket && row.storage_path) {
        try {
          const signed = await supabaseAdmin.storage
            .from(row.storage_bucket)
            .createSignedUrl(row.storage_path, 60 * 60);

          if (!signed.error) {
            signedUrl = signed.data.signedUrl;
          }
        } catch {
          // ignore signing failures
        }
      }

      return {
        ...row,
        signed_url: signedUrl,
      };
    })
  );

  return rows;
}

async function syncPortalStateForAsset(quoteId: string) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("quote_portal_state")
    .select("*")
    .eq("quote_id", quoteId)
    .maybeSingle();

  if (
    existingError &&
    !String(existingError.message || "").toLowerCase().includes("no rows")
  ) {
    throw new Error(existingError.message);
  }

  const milestones = Array.isArray(existing?.milestones) ? existing.milestones : [];
  const nextMilestones = setMilestoneDone(
    milestones,
    "assets_submitted",
    "Content/assets submitted",
    true
  );

  const currentStatus = String(existing?.client_status || "").trim();
  const nextStatus =
    !currentStatus || currentStatus === "new" || currentStatus === "intake_review"
      ? "content_submitted"
      : currentStatus;

  const patch = {
    ...(existing || {}),
    quote_id: quoteId,
    client_status: nextStatus,
    client_updated_at: new Date().toISOString(),
    milestones: nextMilestones,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabaseAdmin
    .from("quote_portal_state")
    .upsert(patch, { onConflict: "quote_id" });

  if (upsertError) {
    throw new Error(upsertError.message);
  }
}

async function getNotificationContext(quoteId: string) {
  const { data: quote, error: quoteError } = await supabaseAdmin
    .from("quotes")
    .select("id, public_token, lead_id")
    .eq("id", quoteId)
    .maybeSingle();

  if (quoteError || !quote) {
    return null;
  }

  let leadName = "";
  let leadEmail = "";

  if (quote.lead_id) {
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("name, email")
      .eq("id", quote.lead_id)
      .maybeSingle();

    leadName = String(lead?.name || "");
    leadEmail = String(lead?.email || "");
  }

  return {
    event: "asset_submitted",
    quoteId,
    leadName,
    leadEmail,
    workspaceUrl: quote.public_token ? `/portal/${quote.public_token}` : undefined,
  } as const;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";
    const resolved = await resolvePortalAccess(token);

    if (!resolved) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired portal token." },
        { status: 404 }
      );
    }

    const rows = await listAssetsForQuote(resolved.quoteId);
    return NextResponse.json({ ok: true, assets: rows });
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
    const rl = enforceRateLimit({ key: `portal-assets:${ip}`, limit: 10, windowMs: 60_000 });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const resolved = await resolvePortalAccess(body?.token || "");

      if (!resolved) {
        return NextResponse.json(
          { ok: false, error: "Invalid or expired portal token." },
          { status: 404 }
        );
      }

      const url = String(body?.url || "").trim();
      if (!url) {
        return NextResponse.json(
          { ok: false, error: "Asset URL is required." },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("portal_assets")
        .insert({
          quote_id: resolved.quoteId,
          source: "portal_link",
          asset_type: String(body?.assetType || "link").trim(),
          label: String(body?.label || "Client link").trim(),
          url,
          notes: String(body?.notes || "").trim(),
          status: "submitted",
        })
        .select("*")
        .single();

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 }
        );
      }

      await syncPortalStateForAsset(resolved.quoteId);

      const notificationCtx = await getNotificationContext(resolved.quoteId);
      if (notificationCtx) {
        sendEventNotification(notificationCtx).catch((err) => {
          console.error("[portal/assets] notification error:", err);
        });
      }

      return NextResponse.json({ ok: true, asset: data });
    }

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();

      const token = String(form.get("token") || "");
      const resolved = await resolvePortalAccess(token);

      if (!resolved) {
        return NextResponse.json(
          { ok: false, error: "Invalid or expired portal token." },
          { status: 404 }
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
          { ok: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.` },
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

      const bytes = await maybeFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const safeName = sanitizeFilename(maybeFile.name || "upload.bin");
      const storagePath = `${resolved.quoteId}/${Date.now()}_${safeName}`;

      const upload = await supabaseAdmin.storage
        .from(ASSET_BUCKET)
        .upload(storagePath, buffer, {
          contentType: maybeFile.type || "application/octet-stream",
          upsert: false,
        });

      if (upload.error) {
        return NextResponse.json(
          {
            ok: false,
            error:
              upload.error.message ||
              `Storage upload failed. Make sure bucket "${ASSET_BUCKET}" exists.`,
          },
          { status: 500 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("portal_assets")
        .insert({
          quote_id: resolved.quoteId,
          source: "portal_file",
          asset_type: String(form.get("assetType") || "file"),
          label: String(form.get("label") || maybeFile.name || "Client file"),
          notes: String(form.get("notes") || ""),
          storage_bucket: ASSET_BUCKET,
          storage_path: storagePath,
          file_name: maybeFile.name || safeName,
          mime_type: maybeFile.type || "application/octet-stream",
          file_size: maybeFile.size || null,
          status: "submitted",
        })
        .select("*")
        .single();

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 }
        );
      }

      await syncPortalStateForAsset(resolved.quoteId);

      const notificationCtx = await getNotificationContext(resolved.quoteId);
      if (notificationCtx) {
        sendEventNotification(notificationCtx).catch((err) => {
          console.error("[portal/assets] notification error:", err);
        });
      }

      return NextResponse.json({ ok: true, asset: data });
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