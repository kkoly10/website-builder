// app/api/portal/revision/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolvePortalAccess } from "@/lib/portalAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RevisionPayload = {
  token: string;
  page?: string;
  priority?: string;
  requestType?: string;
  message?: string;
};

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";
    const resolved = await resolvePortalAccess(token);

    if (!resolved) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired portal token." },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("portal_revisions")
      .select("*")
      .eq("quote_id", resolved.quoteId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, revisions: data ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RevisionPayload;
    const resolved = await resolvePortalAccess(body.token || "");

    if (!resolved) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired portal token." },
        { status: 404 }
      );
    }

    const message = (body.message || "").trim();
    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Revision request message is required." },
        { status: 400 }
      );
    }

    const insertRow = {
      quote_id: resolved.quoteId,
      page: (body.page || "General").trim(),
      priority: (body.priority || "normal").trim(),
      request_type: (body.requestType || "change").trim(),
      message,
      status: "new",
    };

    const { data, error } = await supabaseAdmin
      .from("portal_revisions")
      .insert(insertRow)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, revision: data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}