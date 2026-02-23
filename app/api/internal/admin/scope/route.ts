// app/api/internal/admin/scope/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pickPiePayload(row: any) {
  return (
    row?.report_json ??
    row?.report ??
    row?.payload ??
    row?.data ??
    row?.json ??
    {}
  );
}

function num(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function ensureProjectIdForQuote(quoteId: string): Promise<string> {
  const rpc = await supabaseAdmin.rpc("ensure_project_for_quote", { p_quote_id: quoteId });
  if (rpc.error) throw new Error(rpc.error.message || "Failed to ensure project");
  if (!rpc.data) throw new Error("ensure_project_for_quote returned no project id");
  return String(rpc.data);
}

async function getLatestPieForProject(projectId: string, quoteId: string) {
  let { data, error } = await supabaseAdmin
    .from("pie_reports")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    const fallback = await supabaseAdmin
      .from("pie_reports")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallback.error) throw new Error(fallback.error.message);
    data = fallback.data ?? null;
  }

  return data;
}

async function getNextVersion(projectId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("project_scope_snapshots")
    .select("version_no")
    .eq("project_id", projectId)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.version_no ?? 0) + 1;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || "");

    if (!action) {
      return NextResponse.json({ ok: false, error: "Missing action" }, { status: 400 });
    }

    // -----------------------------------------
    // CREATE SNAPSHOT FROM LATEST PIE
    // -----------------------------------------
    if (action === "create_from_pie") {
      const quoteId = String(body?.quoteId || "");
      if (!quoteId) {
        return NextResponse.json({ ok: false, error: "Missing quoteId" }, { status: 400 });
      }

      const projectId = await ensureProjectIdForQuote(quoteId);
      const pieRow = await getLatestPieForProject(projectId, quoteId);

      if (!pieRow) {
        return NextResponse.json(
          { ok: false, error: "No PIE report found for this quote yet." },
          { status: 400 }
        );
      }

      const pie = pickPiePayload(pieRow);

      const piePricing = pie?.pricing || {};
      const hours = pie?.hours || pie?.effort || {};
      const timeline = pie?.timeline || {};

      const hoursMin =
        num(pie?.hoursMin) ??
        num(hours?.min) ??
        num(pie?.estimatedHoursMin) ??
        null;

      const hoursMax =
        num(pie?.hoursMax) ??
        num(hours?.max) ??
        num(pie?.estimatedHoursMax) ??
        null;

      const priceTarget =
        num(piePricing?.target) ??
        num(pie?.pricingTarget) ??
        num(pieRow?.pricing_target) ??
        null;

      const priceMin =
        num(piePricing?.minimum) ??
        num(piePricing?.min) ??
        num(pie?.pricingMin) ??
        num(pieRow?.pricing_min) ??
        null;

      const priceMax =
        num(piePricing?.maximum) ??
        num(piePricing?.max) ??
        num(
          Array.isArray(piePricing?.buffers)
            ? piePricing.buffers.find((b: any) =>
                String(b?.label || "").toLowerCase().includes("upper")
              )?.amount
            : null
        ) ??
        num(pie?.pricingMax) ??
        num(pieRow?.pricing_max) ??
        null;

      const summaryText =
        String(pie?.summary || "").trim() ||
        `Scope snapshot generated from PIE (${pieRow?.tier || "Unknown"} tier).`;

      const timelineText =
        String(
          pie?.timelineText ||
            timeline?.text ||
            pie?.timelineEstimate ||
            ""
        ).trim() || null;

      const snapshotPayload = {
        generatedFrom: "pie",
        pieReportId: pieRow?.id ?? null,
        pieTier: pieRow?.tier ?? pie?.tier ?? null,
        pieScore: pieRow?.score ?? pie?.score ?? null,
        confidence: pieRow?.confidence ?? pie?.confidence ?? null,
        summary: pie?.summary ?? null,
        risks: Array.isArray(pie?.risks) ? pie.risks : [],
        pitch: pie?.pitch ?? null,
        pricing: pie?.pricing ?? null,
        hours: {
          min: hoursMin,
          max: hoursMax,
        },
        timeline: {
          text: timelineText,
        },
        rawPie: pie,
      };

      const versionNo = await getNextVersion(projectId);

      const insertRes = await supabaseAdmin
        .from("project_scope_snapshots")
        .insert({
          project_id: projectId,
          quote_id: quoteId,
          version_no: versionNo,
          status: "draft",
          source: "pie",
          summary_text: summaryText,
          timeline_text: timelineText,
          price_target: priceTarget,
          price_min: priceMin,
          price_max: priceMax,
          hours_min: hoursMin,
          hours_max: hoursMax,
          snapshot: snapshotPayload,
          created_by: "admin",
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (insertRes.error) {
        throw new Error(insertRes.error.message);
      }

      return NextResponse.json({
        ok: true,
        scopeSnapshot: insertRes.data,
      });
    }

    // -----------------------------------------
    // UPDATE SNAPSHOT STATUS / EDIT SUMMARY
    // -----------------------------------------
    if (action === "update_snapshot") {
      const scopeSnapshotId = String(body?.scopeSnapshotId || "");
      if (!scopeSnapshotId) {
        return NextResponse.json(
          { ok: false, error: "Missing scopeSnapshotId" },
          { status: 400 }
        );
      }

      const patch: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (typeof body?.status === "string" && body.status.trim()) {
        patch.status = body.status.trim();
      }
      if (typeof body?.summaryText === "string") {
        patch.summary_text = body.summaryText;
      }
      if (typeof body?.timelineText === "string") {
        patch.timeline_text = body.timelineText;
      }
      if (body?.priceTarget !== undefined) patch.price_target = num(body.priceTarget);
      if (body?.priceMin !== undefined) patch.price_min = num(body.priceMin);
      if (body?.priceMax !== undefined) patch.price_max = num(body.priceMax);
      if (body?.hoursMin !== undefined) patch.hours_min = num(body.hoursMin);
      if (body?.hoursMax !== undefined) patch.hours_max = num(body.hoursMax);

      const { data, error } = await supabaseAdmin
        .from("project_scope_snapshots")
        .update(patch)
        .eq("id", scopeSnapshotId)
        .select("*")
        .single();

      if (error) throw new Error(error.message);

      return NextResponse.json({ ok: true, scopeSnapshot: data });
    }

    // -----------------------------------------
    // CREATE SNAPSHOT MANUALLY (from admin form)
    // -----------------------------------------
    if (action === "create_manual") {
      const quoteId = String(body?.quoteId || "");
      if (!quoteId) {
        return NextResponse.json({ ok: false, error: "Missing quoteId" }, { status: 400 });
      }

      const projectId = await ensureProjectIdForQuote(quoteId);
      const versionNo = await getNextVersion(projectId);

      const snapshotPayload = body?.snapshot && typeof body.snapshot === "object"
        ? body.snapshot
        : {};

      const { data, error } = await supabaseAdmin
        .from("project_scope_snapshots")
        .insert({
          project_id: projectId,
          quote_id: quoteId,
          version_no: versionNo,
          status: body?.status || "draft",
          source: "admin",
          summary_text: body?.summaryText || null,
          timeline_text: body?.timelineText || null,
          price_target: num(body?.priceTarget),
          price_min: num(body?.priceMin),
          price_max: num(body?.priceMax),
          hours_min: num(body?.hoursMin),
          hours_max: num(body?.hoursMax),
          snapshot: snapshotPayload,
          created_by: "admin",
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error) throw new Error(error.message);

      return NextResponse.json({ ok: true, scopeSnapshot: data });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}