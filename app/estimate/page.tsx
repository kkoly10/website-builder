import EstimateClient from "./EstimateClient";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function pick(sp: SP, key: string) {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

function toBool(v?: string) {
  return v === "true" || v === "True" || v === "1";
}

function toList(v?: string) {
  if (!v) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function EstimatePage({ searchParams }: { searchParams: SP }) {
  const intake = {
    mode: pick(searchParams, "mode") || "",
    intent: pick(searchParams, "intent") || "",
    intentOther: pick(searchParams, "intentOther") || "",

    websiteType: pick(searchParams, "websiteType") || "Business",
    pages: pick(searchParams, "pages") || "4-5",

    booking: toBool(pick(searchParams, "booking")),
    payments: toBool(pick(searchParams, "payments")),
    blog: toBool(pick(searchParams, "blog")),
    membership: toBool(pick(searchParams, "membership")),

    wantsAutomation: pick(searchParams, "wantsAutomation") || "No",
    automationTypes: toList(pick(searchParams, "automationTypes")),
    integrations: toList(pick(searchParams, "integrations")),
    integrationOther: pick(searchParams, "integrationOther") || "",

    hasLogo: pick(searchParams, "hasLogo") || "Yes",
    hasBrandGuide: pick(searchParams, "hasBrandGuide") || "No",
    contentReady: pick(searchParams, "contentReady") || "Some",
    assetsSource: pick(searchParams, "assetsSource") || "Client provides",
    referenceWebsite: pick(searchParams, "referenceWebsite") || "",

    decisionMaker: pick(searchParams, "decisionMaker") || "Yes",
    stakeholdersCount: pick(searchParams, "stakeholdersCount") || "1",

    design: pick(searchParams, "design") || "Modern",
    timeline: pick(searchParams, "timeline") || "2-3 weeks",

    notes: pick(searchParams, "notes") || "",
  };

  const leadEmail = pick(searchParams, "leadEmail") || "";
  const leadPhone = pick(searchParams, "leadPhone") || "";

  return <EstimateClient intake={intake} leadEmail={leadEmail} leadPhone={leadPhone} />;
}