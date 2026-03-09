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
          <rect
            x="1"
            y="1"
            width="44"
            height="44"
            rx="13"
            fill="#0a0c14"
            stroke="#252a3a"
          />

          <defs>
            <linearGradient id="crecyBrandGrad" x1="9" y1="9" x2="37" y2="37">
              <stop offset="0%" stopColor="#c9a84c" />
              <stop offset="100%" stopColor="#dfc06a" />
            </linearGradient>
          </defs>

          {/* C stroke with more margin from badge edge */}
          <path
            d="M30.3 15.9C28.9 14.6 27 13.8 24.8 13.8C20 13.8 16.1 17.8 16.1 22.6C16.1 27.4 20 31.4 24.8 31.4C27 31.4 28.9 30.6 30.3 29.3"
            stroke="url(#crecyBrandGrad)"
            strokeWidth="2.9"
            strokeLinecap="round"
          />

          {/* S stroke centered with lighter weight for legibility */}
          <path
            d="M27.6 17.8C26.7 17.2 25.5 16.8 24.3 16.8C22.4 16.8 21 17.8 21 19.2C21 20.5 22 21.3 24.1 21.7C26.7 22.2 27.9 23.1 27.9 24.8C27.9 26.6 26.2 27.7 23.9 27.7C22.5 27.7 21.2 27.2 20.2 26.4"
            stroke="url(#crecyBrandGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="brandLogoText">
        <span className="brandLogoTitle">CrecyStudio</span>
        {showTag ? (
          <span className="brandLogoSub">
            Websites &bull; Automation &bull; Portal Systems
          </span>
        ) : null}
      </span>
    </Link>
  );
}
