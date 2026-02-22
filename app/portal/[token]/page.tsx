// app/portal/[token]/page.tsx
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolvePortalAccess } from "@/lib/portalAccess";
import PortalClient from "./PortalClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ token: string }> | { token: string };
};

export default async function PortalPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params as any);
  const token = resolvedParams?.token;

  if (!token) notFound();

  const access = await resolvePortalAccess(token);
  if (!access) notFound();

  const quoteId = access.quoteId;

  const { data: quote, error: quoteErr } = await supabaseAdmin
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (quoteErr || !quote) {
    notFound();
  }

  let lead: any = null;
  const leadId = (quote as any)?.lead_id;
  if (leadId) {
    const leadRes = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();
    lead = leadRes.data ?? null;
  }

  const callReqRes = await supabaseAdmin
    .from("call_requests")
    .select("*")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const callRequest = callReqRes.data ?? null;

  return (
    <PortalClient
      token={token}
      quote={quote}
      lead={lead}
      callRequest={callRequest}
    />
  );
}