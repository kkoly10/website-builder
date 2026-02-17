import EstimateClient from "./EstimateClient";

export default function EstimatePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // Pass searchParams directly (only keys that exist will be present)
  return <EstimateClient intake={searchParams ?? {}} />;
}