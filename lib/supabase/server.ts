// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
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
          // RSC can throw if trying to set cookies during render.
          // Safe to ignore here; route handlers/actions will handle it.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // Same reason as above.
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

export function isAdminEmail(email?: string | null) {
  if (!email) return false;

  const raw = process.env.ADMIN_EMAILS || "";
  const list = raw
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  return list.includes(email.toLowerCase());
}

export function safeNextPath(next?: string | null) {
  if (!next) return null;
  if (!next.startsWith("/")) return null; // block external redirects
  return next;
}