import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// /portal lives outside the [locale] segment, so we redirect with a plain
// path rather than the i18n-aware redirect (which expects a locale).
export default function DepositLandingPage() {
  redirect("/portal");
}
