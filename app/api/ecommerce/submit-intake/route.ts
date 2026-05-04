import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient, normalizeEmail } from "@/lib/supabase/server";
import { enforceRateLimitDurable, getIpFromHeaders, rateLimitResponse } from "@/lib/rateLimit";
import { recordServerEvent } from "@/lib/analytics/server";
import { getEcommercePricing } from "@/lib/pricing";
import { pickPreferredLocale } from "@/lib/preferredLocale";

type Recommendation = Record<string, any>;

export const dynamic = "force-dynamic";

async function insertEcomIntake(basePayload: Record<string, any>, recommendationSnapshot: Recommendation) {
  const firstAttempt = await supabaseAdmin
    .from("ecom_intakes")
    .insert({
      ...basePayload,
      recommendation_json: recommendationSnapshot,
    })
    .select("id")
    .single<{ id: string }>();

  if (!firstAttempt.error && firstAttempt.data?.id) {
    return firstAttempt;
  }

  const errorMessage = String(firstAttempt.error?.message || "");
  const missingRecommendationJsonColumn = /recommendation_json/i.test(errorMessage);

  if (!missingRecommendationJsonColumn) {
    return firstAttempt;
  }

  return await supabaseAdmin.from("ecom_intakes").insert(basePayload).select("id").single<{ id: string }>();
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIpFromHeaders(req.headers);
    const rl = await enforceRateLimitDurable({ key: `ecom-submit-intake:${ip}`, limit: 8, windowMs: 60_000 });
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

    const recommendation =
      body?.recommendation && typeof body.recommendation === "object"
        ? (body.recommendation as Recommendation)
        : getEcommercePricing({
            entryPath: body?.entryPath ?? null,
            businessName,
            platform: String(body.platform ?? "").trim(),
            salesChannels: Array.isArray(body.salesChannels) ? body.salesChannels : [],
            serviceTypes: Array.isArray(body.serviceTypes) ? body.serviceTypes : [],
            skuCount: String(body.skuCount ?? "").trim(),
            monthlyOrders: String(body.monthlyOrders ?? "").trim(),
            peakOrders: String(body.peakOrders ?? "").trim(),
            budgetRange: String(body.budgetRange ?? "").trim(),
            timeline: String(body.timeline ?? "").trim(),
            storeUrl: String(body.storeUrl ?? "").trim(),
            notes: String(body.notes ?? "").trim(),
          });

    const payload: Record<string, any> = {
      business_name: businessName,
      contact_name: contactName,
      email,
      phone: String(body.phone ?? "").trim() || null,
      store_url: String(body.storeUrl ?? "").trim() || null,
      platform: String(body.platform ?? "").trim() || null,
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
      readiness_stage: String(body.readinessStage ?? body.entryPath ?? "").trim() || null,
      budget_range: String(body.budgetRange ?? "").trim() || null,
      timeline: String(body.timeline ?? "").trim() || null,
      decision_maker: String(body.decisionMaker ?? "").trim() || null,
      notes: String(body.notes ?? "").trim() || null,
      content_source: String(body.contentSource ?? "").trim() || null,
      migration_scope: Array.isArray(body.migrationScope) ? body.migrationScope : [],
      compliance: Array.isArray(body.compliance) ? body.compliance : [],
      budget_flexibility: String(body.budgetFlexibility ?? "").trim() || null,
      status: "new",
      preferred_locale: pickPreferredLocale(body?.preferredLocale ?? body?.locale),
    };

    if (authUserId && authUserEmail === email) payload.auth_user_id = authUserId;

    const { data, error } = await insertEcomIntake(payload, recommendation);

    if (error || !data?.id) {
      return NextResponse.json({ ok: false, error: error?.message || "Failed to save e-commerce intake." }, { status: 500 });
    }

    await recordServerEvent({
      event: "ecom_intake_submitted",
      page: "/ecommerce/intake",
      ip,
      metadata: {
        ecomIntakeId: data.id,
        attachedToUser: !!payload.auth_user_id,
        pricingVersion: recommendation.version,
        tierKey: recommendation.tierKey,
        billingModel: recommendation.billingModel,
      },
    });

    return NextResponse.json({ ok: true, ecomIntakeId: data.id, nextUrl: `/ecommerce/book?ecomIntakeId=${encodeURIComponent(data.id)}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
