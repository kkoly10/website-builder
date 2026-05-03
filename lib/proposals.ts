import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type ProposalLifecycle = {
  id: string;
  status: string;
  sentAt: string | null;
  viewedAt: string | null;
  acceptedAt: string | null;
};

export async function getProposalByQuoteId(quoteId: string): Promise<ProposalLifecycle | null> {
  const { data } = await supabaseAdmin
    .from("proposals")
    .select("id, status, sent_at, viewed_at, accepted_at")
    .eq("quote_id", quoteId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    status: data.status,
    sentAt: data.sent_at,
    viewedAt: data.viewed_at,
    acceptedAt: data.accepted_at,
  };
}

export async function ensureProposalExists(quoteId: string): Promise<ProposalLifecycle> {
  const existing = await getProposalByQuoteId(quoteId);
  if (existing) return existing;
  const { data } = await supabaseAdmin
    .from("proposals")
    .insert({ quote_id: quoteId, status: "draft" })
    .select("id, status, sent_at, viewed_at, accepted_at")
    .single();
  return {
    id: data!.id,
    status: data!.status,
    sentAt: null,
    viewedAt: null,
    acceptedAt: null,
  };
}

export async function markProposalSent(quoteId: string): Promise<void> {
  const proposal = await ensureProposalExists(quoteId);
  if (proposal.status !== "draft") return;
  await supabaseAdmin
    .from("proposals")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", proposal.id);
}

export async function markProposalViewed(quoteId: string): Promise<void> {
  await supabaseAdmin
    .from("proposals")
    .update({ status: "viewed", viewed_at: new Date().toISOString() })
    .eq("quote_id", quoteId)
    .eq("status", "sent");
}
