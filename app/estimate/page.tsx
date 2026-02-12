import EstimateClient from "./EstimateClient";

type SearchParams = Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export default function EstimatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return <EstimateClient searchParams={searchParams} />;
}