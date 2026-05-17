/**
 * Seed the demo portal row — run once after deploying /demos/portal.
 *
 *   npx tsx scripts/seed-demo-portal.ts
 *
 * Safe to re-run: all inserts use ON CONFLICT DO NOTHING via upsert with
 * ignoreDuplicates, so re-running is idempotent.
 *
 * Uses the service role key from SUPABASE_SERVICE_ROLE_KEY env var.
 * Reads .env.local automatically via fs (no dotenv dependency required).
 */

import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as fs from "fs";

// Load .env.local relative to repo root without requiring dotenv
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// Guard against accidental prod pollution. The seed script writes a row
// with the hardcoded "demo" access token (used by /demos/portal). If a
// mismatched .env.local points this script at prod, it'd seed prod with
// the demo lead + quote + portal. The /api/portal/assets route has a
// hard guard rejecting writes against the demo token, but the static
// rows themselves would still pollute prod tables.
//
// Opt-in: pass --confirm-prod to acknowledge you're intentionally
// seeding a non-local environment (e.g. staging that wants a demo).
const isLocalUrl =
  /localhost|127\.0\.0\.1|host\.docker\.internal/i.test(supabaseUrl);
const confirmedProd = process.argv.includes("--confirm-prod");
if (!isLocalUrl && !confirmedProd) {
  console.error(
    `Refusing to seed: NEXT_PUBLIC_SUPABASE_URL (${supabaseUrl}) looks like a non-local environment.\n` +
    `If you really want to seed a demo portal in staging/prod, re-run with --confirm-prod.`,
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Fixed IDs so the script is idempotent
const DEMO_LEAD_ID = "00000000-0000-0000-0001-000000000001";
const DEMO_QUOTE_ID = "00000000-0000-0000-0001-000000000002";
const DEMO_PORTAL_ID = "00000000-0000-0000-0001-000000000003";
const DEMO_TOKEN = "demo";

async function upsert(table: string, rows: object | object[], matchOn: string) {
  const arr = Array.isArray(rows) ? rows : [rows];
  const { error } = await supabase
    .from(table)
    .upsert(arr, { onConflict: matchOn, ignoreDuplicates: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ✓ ${table} (${arr.length} row${arr.length > 1 ? "s" : ""})`);
}

async function main() {
  console.log(`\nSeeding demo portal → ${supabaseUrl}\n`);

  // 1. Lead
  await upsert("leads", {
    id: DEMO_LEAD_ID,
    email: "demo@crecystudio.com",
    name: "Sarah Chen",
  }, "id");

  // 2. Quote — Growth tier website project
  await upsert("quotes", {
    id: DEMO_QUOTE_ID,
    lead_id: DEMO_LEAD_ID,
    status: "active",
    public_token: "demo-quote",
    estimate_total: 4200,
    quote_json: {
      projectType: "website",
      pricingTruth: {
        version: "3.0",
        lane: "website",
        tierKey: "growth",
        tierLabel: "Growth",
        position: "middle",
        isCustomScope: false,
        band: { min: 3500, max: 5500, target: 4200 },
        displayRange: "$3,500 – $5,500",
        summary: "A multi-page business site with lead capture, contact form, and SEO foundation.",
      },
      intakeRaw: {
        websiteType: "Business",
        intent: "Leads",
        pages: "4-5",
        timeline: "2-3 weeks",
        contentReady: "Some",
      },
    },
  }, "id");

  // 3. Portal project
  await upsert("customer_portal_projects", {
    id: DEMO_PORTAL_ID,
    quote_id: DEMO_QUOTE_ID,
    access_token: DEMO_TOKEN,
    project_status: "in_progress",
    deposit_status: "paid",
    deposit_amount_cents: 210000,
    kickoff_notes: "Revision round underway. Preview link coming in 24h.",
    scope_snapshot: {
      tierLabel: "Growth",
      platform: "Next.js + Supabase",
      pagesIncluded: "Up to 5 pages",
      featuresIncluded: ["Lead capture form", "Mobile-responsive", "SEO foundation", "Contact page"],
      timeline: "2–3 weeks",
      revisionPolicy: "2 rounds included",
      exclusions: ["E-commerce", "Blog CMS", "Custom integrations"],
    },
  }, "id");

  // 4. Milestones
  await upsert("customer_portal_milestones", [
    { id: "00000000-0000-0000-0002-000000000001", portal_project_id: DEMO_PORTAL_ID, title: "Scope & kickoff confirmed", status: "done", sort_order: 10 },
    { id: "00000000-0000-0000-0002-000000000002", portal_project_id: DEMO_PORTAL_ID, title: "Content & assets received", status: "done", sort_order: 20 },
    { id: "00000000-0000-0000-0002-000000000003", portal_project_id: DEMO_PORTAL_ID, title: "First build draft", status: "done", sort_order: 30 },
    { id: "00000000-0000-0000-0002-000000000004", portal_project_id: DEMO_PORTAL_ID, title: "Revision round", status: "active", sort_order: 40 },
    { id: "00000000-0000-0000-0002-000000000005", portal_project_id: DEMO_PORTAL_ID, title: "Launch & handoff", status: "todo", sort_order: 50 },
  ], "id");

  // 5. Messages
  await upsert("customer_portal_messages", [
    {
      id: "00000000-0000-0000-0004-000000000001",
      portal_project_id: DEMO_PORTAL_ID,
      sender_role: "studio",
      sender_name: "CrecyStudio",
      body: "Hey Sarah 👋 Scope is locked and we're off. You'll get a first-draft preview link by end of week.",
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "00000000-0000-0000-0004-000000000002",
      portal_project_id: DEMO_PORTAL_ID,
      sender_role: "client",
      sender_name: "Sarah Chen",
      body: "Great, looking forward to it! One thing — can we make sure the contact form goes to both me and my assistant?",
      created_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "00000000-0000-0000-0004-000000000003",
      portal_project_id: DEMO_PORTAL_ID,
      sender_role: "studio",
      sender_name: "CrecyStudio",
      body: "Noted — we'll wire the form to route to both addresses. First draft is live in the preview below. Main things left: hero image swap and the About page copy once you send it over.",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ], "id");

  // 6. Assets
  await upsert("customer_portal_assets", [
    {
      id: "00000000-0000-0000-0003-000000000001",
      portal_project_id: DEMO_PORTAL_ID,
      label: "Logo files (SVG + PNG)",
      asset_url: "https://example.com/demo-asset",
      status: "approved",
      asset_type: "file",
    },
    {
      id: "00000000-0000-0000-0003-000000000002",
      portal_project_id: DEMO_PORTAL_ID,
      label: "Homepage copy draft",
      asset_url: "https://example.com/demo-content",
      status: "review",
      asset_type: "link",
    },
  ], "id");

  console.log("\n✅ Demo portal seeded successfully.");
  console.log(`   Access at: /portal/${DEMO_TOKEN}`);
  console.log(`   Public URL: /demos/portal`);
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
