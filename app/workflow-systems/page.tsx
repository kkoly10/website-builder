import type { Metadata } from "next";
import ServicePage from "@/components/service-page/ServicePage";
import { systemsPageData } from "@/lib/service-pages";

export const metadata: Metadata = {
  title: "Workflow Automation | Audit, Build, and Operations Cleanup",
  description:
    "Workflow automation for businesses that need cleaner intake, routing, status tracking, and admin systems.",
};

export default function WorkflowSystemsPage() {
  return <ServicePage {...systemsPageData} />;
}
