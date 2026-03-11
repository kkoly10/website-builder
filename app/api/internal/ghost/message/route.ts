import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isAdminUser } from "@/lib/supabase/server";
import { analyzeClientMessage, buildReplySuggestion } from "@/lib/ghost/message";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const admin = await isAdminUser({ userId: user.id, email: user.email });
  if (!admin) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const message = String(body.message || "").trim();

  if (!message) {
    return NextResponse.json({ ok: false, error: "message is required" }, { status: 400 });
  }

  const analysis = analyzeClientMessage(message);
  const suggestion = buildReplySuggestion(message, analysis);

  const { data: analysisRow } = await supabaseAdmin
    .from("ghost_message_analysis")
    .insert({
      lane: "global",
      source_message_text: message,
      category_label: analysis.categoryLabel,
      sentiment_label: analysis.sentimentLabel,
      urgency_label: analysis.urgencyLabel,
      risk_label: analysis.riskLabel,
      what_client_is_really_asking: analysis.whatClientIsReallyAsking,
      coaching_json: analysis.coachingJson,
    })
    .select("id")
    .maybeSingle();

  await supabaseAdmin.from("ghost_reply_suggestions").insert({
    message_analysis_id: analysisRow?.id || null,
    default_reply: suggestion.defaultReply,
    variants_json: suggestion.variants,
    why_this_works: suggestion.whyThisWorks,
    caution_text: suggestion.cautionText,
    next_action_text: suggestion.nextActionText,
  });

  if (analysis.riskLabel === "high") {
    await supabaseAdmin.from("ghost_guardrail_events").insert({
      lane: "global",
      event_type: "message_risk",
      severity: "high",
      event_text: suggestion.cautionText,
      event_json: { category: analysis.categoryLabel },
    });
  }

  return NextResponse.json({ ok: true, analysis, suggestion });
}
