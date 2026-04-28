import type { Metadata } from "next";
import ServicePage from "@/components/service-page/ServicePage";
import { websitesPageData } from "@/lib/service-pages";

export const metadata: Metadata = {
  title: "Website Building | Premium, Conversion-Focused Websites",
  description:
    "Premium website building for service businesses that need stronger trust, clearer messaging, and better lead conversion.",
};

export default function WebsitesPage() {
  return <ServicePage {...websitesPageData} />;
}