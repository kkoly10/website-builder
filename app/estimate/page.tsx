import EstimateClient from "./EstimateClient";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function pick(sp: SearchParams, key: string) {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

function toBool(v: string | undefined) {
  if (!v) return false;
  return ["1", "true", "yes", "y", "on"].includes(v.toLowerCase());
}

export default function EstimatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Lead fields
  const leadEmail = pick(searchParams, "leadEmail") || pick(searchParams, "email") || "";
  const leadPhone = pick(searchParams, "leadPhone") || pick(searchParams, "phone") || "";

  // Build a lightweight intake object from query params (safe defaults)
  const intake = {
    mode: pick(searchParams, "mode") || "",
    intent: pick(searchParams, "intent") || "",
    intentOther: pick(searchParams, "intentOther") || "",
    websiteType: pick(searchParams, "websiteType") || "Business website",
    pages: pick(searchParams, "pages") || "4-5",
    design: pick(searchParams, "design") || "Modern",
    timeline: pick(searchParams, "timeline") || "2–3 weeks",
    contentReady: pick(searchParams, "contentReady") || "",

    booking: toBool(pick(searchParams, "booking")),
    payments: toBool(pick(searchParams, "payments")),
    blog: toBool(pick(searchParams, "blog")),
    membership: toBool(pick(searchParams, "membership")),

    integrations: pick(searchParams, "integrations") || "",
    wantsAutomation: pick(searchParams, "wantsAutomation") || "",
    automationTypes: pick(searchParams, "automationTypes") || "",

    notes: pick(searchParams, "notes") || "",
  };

  return <EstimateClient intake={intake} leadEmail={leadEmail} leadPhone={leadPhone} />;
}