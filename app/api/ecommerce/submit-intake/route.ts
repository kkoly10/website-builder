import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";
import { enforceRateLimit, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { recordServerEvent } from "@/lib/analytics/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getIpFromHeaders(req.headers);
    const rl = enforceRateLimit({ key: `ecom-submit-intake:${ip}`, limit: 8, windowMs: 60_000 });
    if (!rl.ok) return rateLimitResponse(rl.resetAt);

    const body = await req.json();

    const businessName = String(body.businessName ?? "").trim();
    const contactName = String(body.contactName ?? "").trim();
    const email = normalizeEmail(String(body.email ?? ""));

    if (!businessName || !contactName || !email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "businessName, contactName, and valid email are required." }, { status: 400 });
    }

    let authUserId: string | null = null;
    let authUserEmail: string | null = null;

    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      authUserId = user?.id ?? null;
      authUserEmail = normalizeEmail(user?.email);
    } catch {
      authUserId = null;
      authUserEmail = null;
    }

    const payload: Record<string, any> = {
      business_name: businessName,
      contact_name: contactName,
      email,
      phone: String(body.phone ?? "").trim() || null,
      store_url: String(body.storeUrl ?? "").trim() || null,
      sales_channels: Array.isArray(body.salesChannels) ? body.salesChannels : [],
      service_types: Array.isArray(body.serviceTypes) ? body.serviceTypes : [],
      sku_count: String(body.skuCount ?? "").trim() || null,
      units_in_stock: String(body.unitsInStock ?? "").trim() || null,
      product_size: String(body.productSize ?? "").trim() || null,
      fragile: String(body.fragile ?? "").trim() || null,
      storage_type: String(body.storageType ?? "").trim() || null,
      monthly_orders: String(body.monthlyOrders ?? "").trim() || null,
      peak_orders: String(body.peakOrders ?? "").trim() || null,
      avg_items_per_order: String(body.avgItemsPerOrder ?? "").trim() || null,
      monthly_returns: String(body.monthlyReturns ?? "").trim() || null,
      readiness_stage: String(body.readinessStage ?? "").trim() || null,
      budget_range: String(body.budgetRange ?? "").trim() || null,
      timeline: String(body.timeline ?? "").trim() || null,
      decision_maker: String(body.decisionMaker ?? "").trim() || null,
      notes: String(body.notes ?? "").trim() || null,
      status: "new",
    };

    if (authUserId && authUserEmail === email) payload.auth_user_id = authUserId;

    const { data, error } = await supabaseAdmin.from("ecom_intakes").insert(payload).select("id").single<{ id: string }>();

    if (error || !data?.id) {
      return NextResponse.json({ ok: false, error: error?.message || "Failed to save e-commerce intake." }, { status: 500 });
    }

    await recordServerEvent({
      event: "ecom_intake_submitted",
      page: "/ecommerce/intake",
      ip,
      metadata: { ecomIntakeId: data.id, attachedToUser: !!payload.auth_user_id },
    });

    return NextResponse.json({ ok: true, ecomIntakeId: data.id, nextUrl: `/ecommerce/book?ecomIntakeId=${encodeURIComponent(data.id)}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
