// app/api/portal/assets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolvePortalAccess } from "@/lib/portalAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASSET_BUCKET = process.env.PORTAL_ASSETS_BUCKET || "portal-assets";

function sanitizeFilename(name: string) {
  return (name || "file")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 160);
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
            .createSignedUrl(row.storage_path, 60 * 60); // 1 hour

          if (!signed.error) {
            signedUrl = signed.data.signedUrl;
          }
        } catch {
          // keep null if signing fails
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
    const contentType = req.headers.get("content-type") || "";

    // ---- JSON mode (link submission) ----
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const resolved = await resolvePortalAccess(body?.token || "");

      if (!resolved) {
        return NextResponse.json(
          { ok: false, error: "Invalid or expired portal token." },
          { status: 404 }
        );
      }

      const url = (body?.url || "").trim();
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
          asset_type: (body?.assetType || "link").trim(),
          label: (body?.label || "Client link").trim(),
          url,
          notes: (body?.notes || "").trim(),
          status: "new",
        })
        .select("*")
        .single();

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, asset: data });
    }

    // ---- multipart mode (file upload) ----
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
          status: "new",
        })
        .select("*")
        .single();

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 }
        );
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