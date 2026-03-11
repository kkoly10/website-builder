import type { Metadata } from "next";
import ServicePage from "@/components/service-page/ServicePage";
import { ecommercePageData } from "@/lib/service-pages";

export const metadata: Metadata = {
  title: "E-Commerce Systems | Storefront, Checkout, and Ops Flow",
  description:
    "E-commerce systems for brands that need stronger storefront UX, cleaner checkout flow, and better post-purchase operations.",
};

export default function EcommercePage() {
  return <ServicePage {...ecommercePageData} />;
}