// app/estimate/page.tsx
import EstimateClient from "./EstimateClient";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function asBool(v: string) {
  const s = String(v ?? "").toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

export default function EstimatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // These come from /build (localStorage-driven) OR direct query params
  const intake = {
    mode: pick(searchParams, "mode") || "estimate",
    intent: pick(searchParams, "intent") || "business",
    intentOther: pick(searchParams, "intentOther") || "",

    websiteType: pick(searchParams, "websiteType") || "business",
    pages: pick(searchParams, "pages") || "1-3",

    booking: asBool(pick(searchParams, "booking")),
    payments: asBool(pick(searchParams, "payments")),
    blog: asBool(pick(searchParams, "blog")),
    membership: asBool(pick(searchParams, "membership")),

    wantsAutomation: pick(searchParams, "wantsAutomation") || "no",

    contentReady: pick(searchParams, "contentReady") || "some",
    domainHosting: pick(searchParams, "domainHosting") || "no",

    timeline: pick(searchParams, "timeline") || "2-4w",
    notes: pick(searchParams, "notes") || "",

    // These may arrive as comma-separated strings from /build
    integrations: pick(searchParams, "integrations") || "",
    automationTypes: pick(searchParams, "automationTypes") || "",
    integrationOther: pick(searchParams, "integrationOther") || "",
  };

  const leadEmail = pick(searchParams, "leadEmail") || "";
  const leadPhone = pick(searchParams, "leadPhone") || "";

  return (
    <EstimateClient intake={intake} leadEmail={leadEmail} leadPhone={leadPhone} />
  );
}