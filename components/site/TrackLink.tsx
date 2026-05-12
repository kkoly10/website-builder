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
};

export default function TrackLink({ href, event, className, style, children, metadata }: Props) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={() => {
        trackEvent({ event, metadata, page: typeof window !== "undefined" ? window.location.pathname : undefined });
      }}
    >
      {children}
    </Link>
  );
}
