import EstimateClient from "./EstimateClient";
import { loadEstimatePresentation } from "@/lib/estimatePresentation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParamsPromise = Promise<Record<string, string | string[] | undefined>>;

function pick(sp: Record<string, string | string[] | undefined>, key: string) {
  const value = sp?.[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function pickAny(sp: Record<string, string | string[] | undefined>, keys: string[]) {
  for (const key of keys) {
    const value = pick(sp, key).trim();
    if (value) return value;
  }
  return "";
}

export default async function EstimatePage(props: { searchParams: SearchParamsPromise }) {
  const sp = await props.searchParams;
  const quoteId = pickAny(sp, ["quoteId", "quoteid", "qid", "id"]);
  const quoteToken = pickAny(sp, ["token", "quoteToken", "quote_token", "t"]);

  let userId: string | null = null;
  let userEmail: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    userEmail = user?.email ?? null;
  } catch {
    userId = null;
    userEmail = null;
  }

  const view = await loadEstimatePresentation({
    quoteId,
    quoteToken,
    userId,
    userEmail,
  });

  return <EstimateClient view={view} />;
}
