// app/portal/[token]/page.tsx
import { notFound } from "next/navigation";
import { getCustomerPortalBundleByToken } from "@/lib/customerPortal";
import PortalClient from "./PortalClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CustomerPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const bundle = await getCustomerPortalBundleByToken(token);

  if (!bundle) notFound();

  return <PortalClient token={token} initial={bundle} />;
}