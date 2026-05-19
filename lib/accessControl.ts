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

// Normalize an email for comparison. trim → lowercase is the baseline;
// the NFC Unicode normalization step closes a class of homograph attacks
// where two visually-identical strings have different code-point
// sequences (e.g. precomposed "é" U+00E9 vs decomposed "e" + U+0301).
// Without NFC, two registrations that look identical to a human would
// compare as different strings here and bypass the quote-claim guard.
// Domain casing is normalized by lowercase; we don't IDNA-encode because
// the email field is treated as opaque downstream — the goal is
// consistent equality, not canonical RFC 5891 form.
export function normalizeEmail(value?: string | null) {
  return String(value ?? "")
    .normalize("NFC")
    .trim()
    .toLowerCase();
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

  // Already-claimed short-circuit. If the row already has auth_user_id
  // set and it matches this user, this is a no-op idempotent claim. If
  // it's set and DOESN'T match this user, that's a different user
  // claiming the same quote — refuse (canAttachOwner already guarded
  // this case but defense in depth costs us nothing here).
  if (access.quote.auth_user_id) {
    if (String(access.quote.auth_user_id) === String(args.userId)) {
      return { ok: true as const, skipped: true as const, alreadyAttached: true as const };
    }
    return { ok: false as const, skipped: true as const, reason: "already_claimed" as const };
  }

  const patch = {
    auth_user_id: String(args.userId),
    owner_email_norm: normalizeEmail(args.userEmail),
  };

  // First-write-wins via .is("auth_user_id", null) filter on the UPDATE.
  // Two concurrent claim attempts: the slower one's UPDATE filter no
  // longer matches (auth_user_id became non-null), so it updates 0 rows
  // and we fall back to a re-check. Without this filter, last-write-wins
  // and a racing attacker could overwrite the legitimate owner's claim.
  const { data, error } = await supabaseAdmin
    .from("quotes")
    .update(patch)
    .eq("id", args.quoteId)
    .is("auth_user_id", null)
    .select("id, auth_user_id")
    .maybeSingle();

  if (error) {
    return { ok: false as const, skipped: false as const, error: error.message };
  }

  if (!data) {
    // Race lost — someone else claimed it between resolveQuoteAccess and
    // the UPDATE. Re-read to see whether the winner is us or someone else.
    const { data: latest } = await supabaseAdmin
      .from("quotes")
      .select("auth_user_id")
      .eq("id", args.quoteId)
      .maybeSingle();
    if (latest?.auth_user_id && String(latest.auth_user_id) === String(args.userId)) {
      return { ok: true as const, skipped: true as const, alreadyAttached: true as const };
    }
    return { ok: false as const, skipped: true as const, reason: "race_lost" as const };
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
