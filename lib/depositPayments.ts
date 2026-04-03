import { saveEcommerceWorkspaceState } from "@/lib/ecommerce/workspace";
import { getWorkspaceState, saveWorkspaceState } from "@/lib/opsWorkspace/state";
import { getOpsPricing } from "@/lib/pricing/ops";
import { stripeCreateCheckoutSession } from "@/lib/stripeServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function str(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeObj(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function roundMoney(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.round(num));
}

async function getOrCreateEcomQuote(ecomIntakeId: string) {
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("ecom_quotes")
    .select("*")
    .eq("ecom_intake_id", ecomIntakeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (existing) return existing;

  const { data, error } = await supabaseAdmin
    .from("ecom_quotes")
    .insert({
      ecom_intake_id: ecomIntakeId,
      status: "draft",
      quote_json: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

function getDefaultEcommerceDepositAmount(quote: any) {
  const setupFee = roundMoney(quote?.estimate_setup_fee);
  const monthlyFee = roundMoney(quote?.estimate_monthly_fee);
  const deposit = safeObj(safeObj(quote?.quote_json).deposit);
  const existingAmount = roundMoney(deposit.amount);

  if (existingAmount > 0) return existingAmount;
  if (setupFee > 0 && monthlyFee > 0) return setupFee;
  if (setupFee > 0) return Math.max(100, Math.round(setupFee * 0.5));
  if (monthlyFee > 0) return Math.max(100, Math.round(monthlyFee * 0.5));
  return 100;
}

function buildOpsPricingInput(intake: any) {
  return {
    companyName: str(intake?.company_name),
    industry: str(intake?.industry),
    teamSize: str(intake?.team_size),
    jobVolume: str(intake?.job_volume),
    monthlyRevenue: str(intake?.monthly_revenue),
    budgetRange: str(intake?.budget_range),
    currentTools: Array.isArray(intake?.current_tools) ? intake.current_tools : [],
    painPoints: Array.isArray(intake?.pain_points) ? intake.pain_points : [],
    triedBefore: str(intake?.tried_before),
    workflowsNeeded: Array.isArray(intake?.workflows_needed) ? intake.workflows_needed : [],
    urgency: str(intake?.urgency),
    readiness: str(intake?.readiness),
    notes: str(intake?.notes),
  };
}

export async function ensureEcommerceDepositLink(args: {
  ecomIntakeId: string;
  baseUrl: string;
  depositAmount?: number;
}) {
  const { data: intake, error: intakeError } = await supabaseAdmin
    .from("ecom_intakes")
    .select("id, business_name, contact_name, email")
    .eq("id", args.ecomIntakeId)
    .maybeSingle();

  if (intakeError) throw new Error(intakeError.message);
  if (!intake) throw new Error("E-commerce intake not found.");

  const quote = await getOrCreateEcomQuote(args.ecomIntakeId);
  const quoteJson = safeObj(quote?.quote_json);
  const deposit = safeObj(quoteJson.deposit);

  if (str(deposit.url) && str(deposit.status) !== "paid") {
    return {
      depositUrl: str(deposit.url),
      depositAmount: roundMoney(deposit.amount),
      sessionId: str(deposit.session_id),
      reused: true,
    };
  }

  const depositAmount = roundMoney(args.depositAmount) || getDefaultEcommerceDepositAmount(quote);
  const successUrl = `${args.baseUrl}/deposit/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${args.baseUrl}/deposit/cancel?lane=ecommerce&ecomIntakeId=${encodeURIComponent(args.ecomIntakeId)}`;

  const session = await stripeCreateCheckoutSession({
    amountUsdCents: depositAmount * 100,
    customerEmail: str(intake.email),
    successUrl,
    cancelUrl,
    productName: "CrecyStudio E-commerce Deposit",
    productDescription: `Deposit for e-commerce project ${args.ecomIntakeId}`,
    metadata: {
      lane: "ecommerce",
      ecomIntakeId: args.ecomIntakeId,
      ecomQuoteId: String(quote.id),
    },
  });

  const now = new Date().toISOString();
  const nextQuoteJson = {
    ...quoteJson,
    deposit: {
      session_id: session.id,
      url: session.url,
      amount: depositAmount,
      created_at: now,
      status: "sent",
    },
  };

  const { error: quoteError } = await supabaseAdmin
    .from("ecom_quotes")
    .update({
      status: quote.status === "paid" ? "paid" : "deposit_sent",
      quote_json: nextQuoteJson,
      updated_at: now,
    })
    .eq("id", quote.id);

  if (quoteError) throw new Error(quoteError.message);

  const save = await saveEcommerceWorkspaceState({
    ecomIntakeId: args.ecomIntakeId,
    savedBy: "system",
    patch: {
      depositStatus: "sent",
      depositAmount,
      depositUrl: session.url,
      depositSessionId: session.id,
      depositNotice: "Stripe deposit link created.",
      depositNoticeSentAt: now,
    },
  });

  if (!save.ok) throw new Error(save.error || "Failed to save e-commerce deposit state.");

  return {
    depositUrl: session.url,
    depositAmount,
    sessionId: session.id,
    reused: false,
  };
}

export async function confirmEcommerceDepositPayment(args: {
  ecomIntakeId: string;
  ecomQuoteId?: string | null;
  session: {
    id: string;
    amount_total?: number | null;
    currency?: string | null;
    customer_email?: string | null;
  };
}) {
  const now = new Date().toISOString();

  let quote: any = null;
  if (args.ecomQuoteId) {
    const { data } = await supabaseAdmin
      .from("ecom_quotes")
      .select("*")
      .eq("id", args.ecomQuoteId)
      .maybeSingle();
    quote = data;
  }
  if (!quote) {
    quote = await getOrCreateEcomQuote(args.ecomIntakeId);
  }

  const quoteJson = safeObj(quote?.quote_json);
  const deposit = safeObj(quoteJson.deposit);
  const nextQuoteJson = {
    ...quoteJson,
    deposit: {
      ...deposit,
      session_id: args.session.id,
      amount: roundMoney((args.session.amount_total ?? 0) / 100),
      paid_at: now,
      currency: args.session.currency ?? "usd",
      customer_email: args.session.customer_email ?? null,
      status: "paid",
    },
  };

  await supabaseAdmin
    .from("ecom_quotes")
    .update({
      status: "paid",
      quote_json: nextQuoteJson,
      updated_at: now,
    })
    .eq("id", quote.id);

  await saveEcommerceWorkspaceState({
    ecomIntakeId: args.ecomIntakeId,
    savedBy: "system",
    patch: {
      depositStatus: "paid",
      depositAmount: roundMoney((args.session.amount_total ?? 0) / 100),
      depositSessionId: args.session.id,
      depositPaidAt: now,
      depositNotice: "Deposit received.",
    },
  });
}

export async function ensureOpsDepositLink(args: {
  opsIntakeId: string;
  baseUrl: string;
  depositAmount?: number;
}) {
  const { data: intake, error: intakeError } = await supabaseAdmin
    .from("ops_intakes")
    .select("*")
    .eq("id", args.opsIntakeId)
    .maybeSingle();

  if (intakeError) throw new Error(intakeError.message);
  if (!intake) throw new Error("Ops intake not found.");

  const state = await getWorkspaceState(args.opsIntakeId);
  if (str(state.depositUrl) && str(state.depositStatus) !== "paid") {
    return {
      depositUrl: str(state.depositUrl),
      depositAmount: roundMoney(state.depositAmount),
      sessionId: str(state.depositSessionId),
      reused: true,
    };
  }

  const pricing = getOpsPricing(buildOpsPricingInput(intake));
  const defaultAmount = roundMoney(state.depositAmount) || Math.max(100, Math.round((pricing.band?.target || pricing.band?.min || 200) * 0.5));
  const depositAmount = roundMoney(args.depositAmount) || defaultAmount;

  const successUrl = `${args.baseUrl}/deposit/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${args.baseUrl}/deposit/cancel?lane=ops&opsIntakeId=${encodeURIComponent(args.opsIntakeId)}`;

  const session = await stripeCreateCheckoutSession({
    amountUsdCents: depositAmount * 100,
    customerEmail: str(intake.email),
    successUrl,
    cancelUrl,
    productName: "CrecyStudio Ops Deposit",
    productDescription: `Deposit for ops project ${args.opsIntakeId}`,
    metadata: {
      lane: "ops",
      opsIntakeId: args.opsIntakeId,
    },
  });

  const now = new Date().toISOString();
  const result = await saveWorkspaceState(
    args.opsIntakeId,
    {
      depositStatus: "sent",
      depositAmount,
      depositUrl: session.url,
      depositSessionId: session.id,
      depositNotice: "Stripe deposit link created.",
      depositNoticeSentAt: now,
    },
    "system"
  );

  if (!result.ok) throw new Error(result.error || "Failed to save ops deposit state.");

  return {
    depositUrl: session.url,
    depositAmount,
    sessionId: session.id,
    reused: false,
  };
}

export async function confirmOpsDepositPayment(args: {
  opsIntakeId: string;
  session: {
    id: string;
    amount_total?: number | null;
    currency?: string | null;
    customer_email?: string | null;
  };
}) {
  const now = new Date().toISOString();
  await saveWorkspaceState(
    args.opsIntakeId,
    {
      depositStatus: "paid",
      depositAmount: roundMoney((args.session.amount_total ?? 0) / 100),
      depositSessionId: args.session.id,
      depositPaidAt: now,
      depositNotice: "Deposit received.",
      pipelineStatus: "deposit_paid",
    },
    "system"
  );

  await supabaseAdmin
    .from("ops_intakes")
    .update({ status: "deposit_paid" })
    .eq("id", args.opsIntakeId);
}
