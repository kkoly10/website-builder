// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const client = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

// ✅ IMPORTANT:
// We export a "callable client" so BOTH patterns work:
// - supabaseAdmin.from(...)
// - supabaseAdmin().from(...)
// This prevents the exact TypeScript error you saw earlier.
type AdminClient = typeof client;
type CallableAdmin = (() => AdminClient) & AdminClient;

export const supabaseAdmin: CallableAdmin = Object.assign(() => client, client) as CallableAdmin;