// lib/portalAccess.ts
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type PortalAccessResolved = {
  quoteId: string;
  via: "quote_id" | "portal_token";
  accessRow?: any;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function resolvePortalAccess(
  tokenOrQuoteId: string
): Promise<PortalAccessResolved | null> {
  const raw = (tokenOrQuoteId || "").trim();

  if (!raw) return null;

  // Direct UUID access requires a valid quote to exist and an active portal_access row.
  // This prevents enumeration attacks while still supporting admin preview links.
  if (isUuid(raw)) {
    const { data: accessRow } = await supabaseAdmin
      .from("portal_access")
      .select("*")
      .eq("quote_id", raw)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!accessRow) return null;

    if (accessRow.expires_at) {
      const expires = new Date(accessRow.expires_at).getTime();
      if (!Number.isNaN(expires) && expires < Date.now()) return null;
    }

    return { quoteId: raw, via: "quote_id", accessRow };
  }

  const { data, error } = await supabaseAdmin
    .from("portal_access")
    .select("*")
    .eq("token", raw)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    // Helpful runtime error if the table isn't created yet
    throw new Error(
      `portal_access lookup failed: ${error.message}. Did you run the portal SQL migration?`
    );
  }

  if (!data) return null;

  if (data.expires_at) {
    const expires = new Date(data.expires_at).getTime();
    if (!Number.isNaN(expires) && expires < Date.now()) {
      return null;
    }
  }

  return {
    quoteId: data.quote_id,
    via: "portal_token",
    accessRow: data,
  };
}