import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  showTag?: boolean;
  /** Reversed lockup for placement on --cs-ink or dark imagery. */
  onDark?: boolean;
};

/**
 * The CrecyStudio lockup, drawn to match the masters in
 * `crecysstudio svglogo.zip` (crecy-d1-horizontal-light.svg / -dark.svg).
 *
 * The previous version had drifted off those files on all three values it
 * shares with them — ink #0d0d0d instead of #1a1210, accent #a8362b instead
 * of #c43e2b, and the wordmark set in Inter instead of Sora. The header was
 * therefore the one place on the site guaranteed not to match the brand
 * files. Every colour here now reads from a brand token, so the lockup cannot
 * drift again without the token changing.
 *
 * The vermilion dot at the foot of the cursor is the only place pure accent
 * appears in the mark. Do not recolour it (BRAND.md §1).
 */
export default function BrandLogo({
  href = "/",
  showTag = false,
  onDark = false,
}: BrandLogoProps) {
  const ink = onDark ? "var(--paper)" : "var(--cs-ink)";
  const word = onDark ? "var(--cs-muted-2)" : "var(--cs-brand-taupe)";

  return (
    <Link href={href} className="brandLogo" aria-label="CrecyStudio home">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 232 50"
        role="img"
        aria-hidden="true"
        focusable="false"
        style={{ display: "block" }}
      >
        <g transform="translate(0,2)">
          <path d="M4 2 L4 34 L12 26 L22 40 L28 36 L18 22 L30 20 Z" fill={ink} />
          <circle cx="8" cy="40" r="3" fill="var(--cs-accent)" />
        </g>
        {/* Sora, per the masters. Loaded in app/layout.tsx; without it this
            fell back to a system sans and the lockup stopped matching. */}
        <text
          x="46"
          y="33"
          fontSize={27}
          fontFamily="var(--font-wordmark)"
          letterSpacing="-0.9"
        >
          <tspan fill={ink} fontWeight={600}>
            crecy
          </tspan>
          <tspan fill={word} fontWeight={300}>
            studio
          </tspan>
        </text>
      </svg>
      {showTag ? (
        <span className="brandLogoSub">Websites, apps, systems</span>
      ) : null}
    </Link>
  );
}
