import EstimateClient from "./EstimateClient";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function asBool(v: string) {
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export const dynamic = "force-dynamic";

export default function EstimatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const intake = {
    mode: pick(searchParams, "mode") || "estimate",
    intent: pick(searchParams, "intent") || "business",
    intentOther: pick(searchParams, "intentOther") || "",
    websiteType: pick(searchParams, "websiteType") || "business",
    pages: pick(searchParams, "pages") || "1-3",

    // optional fields some versions had
    design: pick(searchParams, "design") || "modern",
    timeline: pick(searchParams, "timeline") || "2-4w",
    contentReady: pick(searchParams, "contentReady") || "some",

    // features
    booking: asBool(pick(searchParams, "booking")),
    payments: asBool(pick(searchParams, "payments")),
    blog: asBool(pick(searchParams, "blog")),
    membership: asBool(pick(searchParams, "membership")),

    // add-ons
    wantsAutomation: pick(searchParams, "wantsAutomation") || "no",

    // ✅ REQUIRED BY Intake (fix)
    hasBrand: pick(searchParams, "hasBrand") || "no",
    domainHosting: pick(searchParams, "domainHosting") || "no",
    budget: pick(searchParams, "budget") || "500-1000",
    competitorUrl: pick(searchParams, "competitorUrl") || "",

    // notes
    notes: pick(searchParams, "notes") || "",
  };

  const leadEmail = pick(searchParams, "leadEmail") || "";
  const leadPhone = pick(searchParams, "leadPhone") || "";

  return (
    <EstimateClient intake={intake} leadEmail={leadEmail} leadPhone={leadPhone} />
  );
}