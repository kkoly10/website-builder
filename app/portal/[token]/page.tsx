import { notFound } from "next/navigation";
import PortalClient from "./PortalClient";
import { getPortalBundleByToken } from "@/lib/portal/server";

export const dynamic = "force-dynamic";

type Params = {
  token: string;
};

export default async function PortalTokenPage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const resolved = await Promise.resolve(params);
  const token = resolved.token;

  const result = await getPortalBundleByToken(token);

  if (!result.ok) {
    notFound();
  }

  return <PortalClient token={token} initialData={result.data} />;
}