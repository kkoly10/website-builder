// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // In RSC render, setting cookies can throw. Safe to ignore here.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // Same as above
        }
      },
    },
  });
}

export function getSiteUrl() {
  let siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  if (!siteUrl.startsWith("http://") && !siteUrl.startsWith("https://")) {
    siteUrl = `https://${siteUrl}`;
  }

  if (!siteUrl.endsWith("/")) {
    siteUrl += "/";
  }

  return siteUrl;
}

export function safeNextPath(next?: string | null) {
  if (!next) return null;
  if (!next.startsWith("/")) return null; // block external redirects
  return next;
}

export function normalizeEmail(email?: string | null) {
  return String(email ?? "").trim().toLowerCase();
}

// Legacy/fallback admin check (kept for compatibility)
export function isAdminEmail(email?: string | null) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  const raw = process.env.ADMIN_EMAILS || "";
  const list = raw
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  return list.includes(normalized);
}

// New DB-backed role check (with env fallback)
export async function isAdminUser(params: { userId?: string | null; email?: string | null }) {
  const userId = params.userId ? String(params.userId) : null;
  const email = normalizeEmail(params.email);

  try {
    if (userId) {
      const { data, error } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!error && data?.role === "admin") return true;
    }
  } catch {
    // ignore and fall back to env email check
  }

  return isAdminEmail(email);
}

// Claims all matching records for a signed-in user by email (website + ops)
export async function claimCustomerRecordsForUser(params: {
  userId?: string | null;
  email?: string | null;
}) {
  const userId = params.userId ? String(params.userId) : "";
  const email = normalizeEmail(params.email);

  if (!userId || !email) {
    return { ok: false, skipped: true, reason: "missing_user_or_email" as const };
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("claim_customer_records", {
      p_user_id: userId,
      p_email: email,
    });

    if (error) {
      return { ok: false, skipped: false, error: error.message };
    }

    return { ok: true, skipped: false, result: data };
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      error: err instanceof Error ? err.message : "Unknown claim error",
    };
  }
}
