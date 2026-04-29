import { Link } from "@/i18n/navigation";
import RawLink from "next/link";
import type { ReactNode } from "react";

type Cta = {
  href: string;
  label: string;
  variant?: "primary" | "ghost";
  // Set true for destinations outside the [locale] segment (e.g. /portal,
  // mailto:, external URLs) so the i18n Link does not add a locale prefix
  // that would 404 on /fr or /es.
  raw?: boolean;
};

export default function SupportPageShell({
  kicker,
  title,
  description,
  children,
  ctas,
}: {
  kicker: string;
  title: string;
  description?: string;
  children: ReactNode;
  ctas?: Cta[];
}) {
  return (
    <main className="container section marketingPage">
      <header className="marketingHero heroFadeUp">
        <p className="kicker">
          <span className="kickerDot" />
          {kicker}
        </p>
        <h1 className="h1">{title}</h1>
        {description ? <p className="p maxW860">{description}</p> : null}
      </header>

      {children}

      {ctas?.length ? (
        <div className="row marketingActions">
          {ctas.map((cta) => {
            const className = `btn ${cta.variant === "ghost" ? "btnGhost" : "btnPrimary"}`;
            // mailto:, tel:, http(s):, and explicitly raw destinations bypass
            // i18n routing — those targets don't live under [locale].
            const isExternalScheme =
              cta.href.startsWith("mailto:") ||
              cta.href.startsWith("tel:") ||
              cta.href.startsWith("http:") ||
              cta.href.startsWith("https:");

            if (cta.raw || isExternalScheme) {
              return (
                <RawLink
                  key={`${cta.href}-${cta.label}`}
                  href={cta.href}
                  className={className}
                >
                  {cta.label}
                </RawLink>
              );
            }
            return (
              <Link
                key={`${cta.href}-${cta.label}`}
                href={cta.href}
                className={className}
              >
                {cta.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </main>
  );
}
