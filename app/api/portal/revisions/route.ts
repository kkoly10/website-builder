// app/api/portal/revisions/route.ts
import { NextResponse } from "next/server";
import { submitRevisionByPortalToken } from "@/lib/customerPortal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const token = String(body?.token || "").trim();
    const requestText = String(body?.requestText || "").trim();

    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
    }
    if (!requestText) {
      return NextResponse.json(
        { ok: false, error: "Revision request cannot be empty" },
        { status: 400 }
      );
    }

    const row = await submitRevisionByPortalToken({ token, requestText });

    return NextResponse.json({ ok: true, revision: row });
  } catch (err: any) {
    console.error("portal/revisions error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to submit revision" },
      { status: 500 }
    );
  }
}