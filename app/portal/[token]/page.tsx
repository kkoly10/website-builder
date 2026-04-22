import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PortalClient from "./PortalClient";
import ScrollReveal from "@/components/site/ScrollReveal";
import { getCustomerPortalViewByToken } from "@/lib/customerPortal";
import { listProjectInvoicesByToken } from "@/lib/projectInvoices";

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

  const result = await getCustomerPortalViewByToken(token);

  if (!result.ok) {
    notFound();
  }

  const invoices = await listProjectInvoicesByToken(token);
  const data = { ...result.data, invoices };

  return (
    <>
      <PortalClient token={token} initialData={redactLead(data)} />
      <ScrollReveal />
    </>
  );
}
