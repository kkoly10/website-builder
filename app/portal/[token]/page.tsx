import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PortalClient from "./PortalClient";
import ScrollReveal from "@/components/site/ScrollReveal";
import { getPortalBundleByToken } from "@/lib/portal/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type Params = {
  token: string;
};

function redactLead<T extends { lead?: any }>(data: T): T {
  if (!data?.lead) return data;
  return {
    ...data,
    lead: {
      ...data.lead,
      email: null,
      phone: null,
    },
  };
}

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

  return (
    <>
      <PortalClient token={token} initialData={redactLead(result.data)} />
      <ScrollReveal />
    </>
  );
}
