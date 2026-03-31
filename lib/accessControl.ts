import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type QuoteAccessArgs = {
  quoteId: string;
  quoteToken?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  leadEmail?: string | null;
};

type QuoteRow = {
  id: string;
  public_token: string | null;
  auth_user_id: string | null;
  owner_email_norm: string | null;
  lead_email: string | null;
};

export function normalizeEmail(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

export function sameNormalizedEmail(a?: string | null, b?: string | null) {
  const left = normalizeEmail(a);
  const right = normalizeEmail(b);
  return !!left && !!right && left === right;
}

export function maskEmail(value?: string | null) {
  const email = normalizeEmail(value);
  if (!email || !email.includes("@")) return null;
  const [local, domain] = email.split("@");
  const safeLocal =
    local.length <= 2 ? `${local[0] ?? "*"}*` : `${local.slice(0, 2)}***`;
  return `${safeLocal}@${domain}`;
}

function canAttachOwner(args: {
  existingUserId?: string | null;
  existingOwnerEmail?: string | null;
  existingLeadEmail?: string | null;
  userId?: string | null;
  userEmail?: string | null;
}) {
  const userId = String(args.userId ?? "").trim();
  const userEmail = normalizeEmail(args.userEmail);
  if (!userId || !userEmail) return false;
  if (args.existingUserId && String(args.existingUserId) === userId) return true;
  if (args.existingUserId && String(args.existingUserId) !== userId) return false;
  return (
    sameNormalizedEmail(userEmail, args.existingOwnerEmail) ||
    sameNormalizedEmail(userEmail, args.existingLeadEmail)
  );
}

function isAuthorizedQuoteActor(args: {
  quote: QuoteRow;
  quoteToken?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  leadEmail?: string | null;
}) {
  const viaToken =
    !!args.quoteToken &&
    !!args.quote.public_token &&
    String(args.quoteToken).trim() === String(args.quote.public_token).trim();

  const viaUser =
    !!args.userId &&
    !!args.quote.auth_user_id &&
    String(args.userId).trim() === String(args.quote.auth_user_id).trim();

  const viaUserEmail =
    sameNormalizedEmail(args.userEmail, args.quote.owner_email_norm) ||
    sameNormalizedEmail(args.userEmail, args.quote.lead_email);

  const viaLeadEmail =
    sameNormalizedEmail(args.leadEmail, args.quote.owner_email_norm) ||
    sameNormalizedEmail(args.leadEmail, args.quote.lead_email);

  return {
    viaToken,
    viaUser,
    viaUserEmail,
    viaLeadEmail,
    ok: viaToken || viaUser || viaUserEmail || viaLeadEmail,
  };
}

export async function resolveQuoteAccess(args: QuoteAccessArgs) {
  const quoteId = String(args.quoteId ?? "").trim();
  if (!quoteId) {
    return { ok: false as const, reason: "missing_quote_id" as const };
  }

  const { data, error } = await supabaseAdmin
    .from("quotes")
    .select("id, public_token, auth_user_id, owner_email_norm, lead_email")
    .eq("id", quoteId)
    .maybeSingle<QuoteRow>();

  if (error) {
    return { ok: false as const, reason: "quote_lookup_failed" as const, error: error.message };
  }

  if (!data) {
    return { ok: false as const, reason: "quote_not_found" as const };
  }

  const auth = isAuthorizedQuoteActor({
    quote: data,
    quoteToken: args.quoteToken,
    userId: args.userId,
    userEmail: args.userEmail,
    leadEmail: args.leadEmail,
  });

  return {
    ok: auth.ok,
    reason: auth.ok ? ("authorized" as const) : ("unauthorized" as const),
    quote: data,
    auth,
    canAttachOwner: canAttachOwner({
      existingUserId: data.auth_user_id,
      existingOwnerEmail: data.owner_email_norm,
      existingLeadEmail: data.lead_email,
      userId: args.userId,
      userEmail: args.userEmail,
    }),
  };
}

export async function maybeAttachQuoteToUser(args: {
  quoteId: string;
  userId?: string | null;
  userEmail?: string | null;
}) {
  const access = await resolveQuoteAccess({
    quoteId: args.quoteId,
    userId: args.userId,
    userEmail: args.userEmail,
  });

  if (!access.ok && access.reason !== "unauthorized") return access;
  if (!access.quote) return access;
  if (!access.canAttachOwner || !args.userId || !args.userEmail) {
    return { ok: false as const, skipped: true as const };
  }

  const patch = {
    auth_user_id: String(args.userId),
    owner_email_norm: normalizeEmail(args.userEmail),
  };

  const { error } = await supabaseAdmin.from("quotes").update(patch).eq("id", args.quoteId);

  if (error) {
    return { ok: false as const, skipped: false as const, error: error.message };
  }

  return { ok: true as const, skipped: false as const };
}

async function maybeAttachByEmailMatch(table: "ops_intakes" | "ecom_intakes", recordId: string, userId?: string | null, userEmail?: string | null) {
  const normalizedUserEmail = normalizeEmail(userEmail);
  const normalizedUserId = String(userId ?? "").trim();
  if (!normalizedUserEmail || !normalizedUserId) {
    return { ok: false as const, skipped: true as const, reason: "missing_actor" as const };
  }

  const { data, error } = await supabaseAdmin
    .from(table)
    .select("id, auth_user_id, email, owner_email_norm")
    .eq("id", recordId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, skipped: false as const, reason: error.message };
  }

  if (!data) {
    return { ok: false as const, skipped: false as const, reason: "not_found" as const };
  }

  const existingUserId = String(data.auth_user_id ?? "").trim();
  if (existingUserId && existingUserId !== normalizedUserId) {
    return { ok: false as const, skipped: true as const, reason: "owned_by_other_user" as const };
  }

  const emailMatches =
    sameNormalizedEmail(normalizedUserEmail, data.email) ||
    sameNormalizedEmail(normalizedUserEmail, data.owner_email_norm);

  if (!emailMatches) {
    return { ok: false as const, skipped: true as const, reason: "email_mismatch" as const };
  }

  const { error: updateError } = await supabaseAdmin
    .from(table)
    .update({ auth_user_id: normalizedUserId, owner_email_norm: normalizedUserEmail })
    .eq("id", recordId);

  if (updateError) {
    return { ok: false as const, skipped: false as const, reason: updateError.message };
  }

  return { ok: true as const, skipped: false as const };
}

export async function maybeAttachOpsIntakeToUser(args: {
  opsIntakeId: string;
  userId?: string | null;
  userEmail?: string | null;
}) {
  return maybeAttachByEmailMatch("ops_intakes", args.opsIntakeId, args.userId, args.userEmail);
}

export async function maybeAttachEcomIntakeToUser(args: {
  ecomIntakeId: string;
  userId?: string | null;
  userEmail?: string | null;
}) {
  return maybeAttachByEmailMatch("ecom_intakes", args.ecomIntakeId, args.userId, args.userEmail);
}

export async function resolveQuoteOwnerAccess(args: {
  quoteId: string;
  userId?: string | null;
  userEmail?: string | null;
}) {
  const access = await resolveQuoteAccess({
    quoteId: args.quoteId,
    userId: args.userId,
    userEmail: args.userEmail,
  });

  if (!access.quote) {
    return { ok: false as const, reason: access.reason };
  }

  const viaUser =
    !!args.userId &&
    !!access.quote.auth_user_id &&
    String(args.userId).trim() === String(access.quote.auth_user_id).trim();

  const viaEmail =
    sameNormalizedEmail(args.userEmail, access.quote.owner_email_norm) ||
    sameNormalizedEmail(args.userEmail, access.quote.lead_email);

  return {
    ok: viaUser || viaEmail,
    reason: viaUser || viaEmail ? ("authorized" as const) : ("unauthorized" as const),
    quote: access.quote,
  };
}
