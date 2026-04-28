import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware Link, redirect, useRouter, usePathname, getPathname.
// Use these instead of importing from next/link or next/navigation in any
// component that lives under app/[locale]/* — they automatically prefix
// the active locale where appropriate and respect the as-needed strategy.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
