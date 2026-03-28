import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  showTag?: boolean;
};

export default function BrandLogo({
  href = "/",
  showTag = false,
}: BrandLogoProps) {
  return (
    <Link href={href} className="brandLogo" aria-label="Crecy Studio home">
      <span className="brandLogoMark" aria-hidden="true">
        <svg
          width="46"
          height="46"
          viewBox="0 0 46 46"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
        >
          {/* Container */}
          <rect
            x="0.5"
            y="0.5"
            width="45"
            height="45"
            rx="13"
            fill="#0a0c14"
            stroke="#252a3a"
            strokeWidth="1"
          />

          {/* Convergence glow — subtle radial behind the focal point */}
          <circle cx="14" cy="23" r="7" fill="#c9a84c" opacity="0.06" />

          {/* Top lane — Websites (primary, full strength) */}
          <path
            d="M33 11.5 C27 15.5, 21 19, 15.5 23"
            stroke="#c9a84c"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Middle lane — Automation (supporting) */}
          <path
            d="M35 23 C29 23, 23 23, 15.5 23"
            stroke="#c9a84c"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />

          {/* Bottom lane — Systems (foundational) */}
          <path
            d="M33 34.5 C27 30.5, 21 27, 15.5 23"
            stroke="#c9a84c"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.24"
          />

          {/* Convergence dot — the unified output */}
          <circle cx="14" cy="23" r="3.2" fill="#c9a84c" />
        </svg>
      </span>
      <span className="brandLogoText">
        <span className="brandLogoTitle">Crecy Studio</span>
        {showTag ? (
          <span className="brandLogoSub">
            Websites &bull; Automation &bull; Systems
          </span>
        ) : null}
      </span>
    </Link>
  );
}
