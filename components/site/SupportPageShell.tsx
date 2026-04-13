import Link from "next/link";
import type { ReactNode } from "react";

type Cta = { href: string; label: string; variant?: "primary" | "ghost" };

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
    <section className="container section marketingPage">
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
          {ctas.map((cta) => (
            <Link
              key={`${cta.href}-${cta.label}`}
              href={cta.href}
              className={`btn ${cta.variant === "ghost" ? "btnGhost" : "btnPrimary"}`}
            >
              {cta.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
