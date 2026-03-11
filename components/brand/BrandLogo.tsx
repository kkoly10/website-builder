// components/brand/BrandLogo.tsx
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
    <Link href={href} className="brandLogo" aria-label="CrecyStudio home">
      <span className="brandLogoMark" aria-hidden="true">
        <svg
          width="46"
          height="46"
          viewBox="0 0 46 46"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
        >
          <rect x="1" y="1" width="44" height="44" rx="13" fill="#0a0c14" stroke="#252a3a" />

          <defs>
            <linearGradient id="crecyBrandGrad" x1="8" y1="8" x2="38" y2="38">
              <stop offset="0%" stopColor="#c9a84c" />
              <stop offset="100%" stopColor="#dfc06a" />
            </linearGradient>
          </defs>

          {/* C stroke — monoline minimal */}
          <path
            d="M30.3 16.1C29 14.8 27.1 14 24.9 14C20.2 14 16.4 17.8 16.4 22.5C16.4 27.2 20.2 31 24.9 31C27.1 31 29 30.2 30.3 28.9"
            fill="none"
            stroke="url(#crecyBrandGrad)"
            strokeWidth="2.55"
            strokeLinecap="round"
          />

          {/* S stroke — monoline minimal */}
          <path
            d="M27 17.9C26.2 17.4 25.4 17.1 24.5 17.1C23.1 17.1 21.9 17.8 21.9 19C21.9 20 22.6 20.8 24.4 21.1C26.9 21.5 27.7 22.8 27.7 24.2C27.7 26 26.2 27 24.1 27C22.8 27 21.5 26.6 20.5 25.9"
            fill="none"
            stroke="url(#crecyBrandGrad)"
            strokeWidth="2.05"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="brandLogoText">
        <span className="brandLogoTitle">CrecyStudio</span>
        {showTag ? <span className="brandLogoSub">Web • Ops • E-Commerce</span> : null}
      </span>
    </Link>
  );
}
