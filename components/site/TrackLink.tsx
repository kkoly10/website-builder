"use client";

import { Link } from "@/i18n/navigation";
import type { CSSProperties, ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/client";

type Props = {
  href: string;
  event: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  metadata?: Record<string, string | number | boolean | null>;
  // Optional rel attribute. Useful for CTAs that point at routes
  // covered by robots.txt's Disallow list — without rel="nofollow",
  // Googlebot follows the link, hits the Disallow rule, and surfaces
  // a "Blocked by robots.txt" report in Search Console. nofollow
  // tells the crawler not to follow without affecting the user's
  // click behavior.
  rel?: string;
};

export default function TrackLink({ href, event, className, style, children, metadata, rel }: Props) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      rel={rel}
      onClick={() => {
        trackEvent({ event, metadata, page: typeof window !== "undefined" ? window.location.pathname : undefined });
      }}
    >
      {children}
    </Link>
  );
}
