import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

function isSensitivePath(pathname: string) {
  return pathname.startsWith("/internal") || pathname.startsWith("/api/internal");
}

async function sendInternalAlert(message: string) {
  const webhook = process.env.INTERNAL_ALERT_WEBHOOK?.trim();
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
  } catch {
    // non-blocking on proxy path
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isSensitivePath(pathname)) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const method = request.method;

    console.log(`[internal-access] ${method} ${pathname} ip=${ip}`);

    if (method !== "GET") {
      await sendInternalAlert(`[internal-mutation] ${method} ${pathname} ip=${ip}`);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
