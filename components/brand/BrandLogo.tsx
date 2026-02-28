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
          width="44"
          height="44"
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
        >
          <rect
            x="1"
            y="1"
            width="42"
            height="42"
            rx="12"
            fill="#0f1220"
            stroke="#262a36"
          />
          <defs>
            <linearGradient id="crecyLogoGrad" x1="8" y1="8" x2="36" y2="36">
              <stop offset="0%" stopColor="#ff8c33" />
              <stop offset="100%" stopColor="#ff6b00" />
            </linearGradient>
          </defs>

          {/* outer C */}
          <path
            d="M30.8 14.2C29.1 12.6 26.9 11.6 24.4 11.6C19.1 11.6 14.8 15.5 14.1 20.6C13.2 26.9 18 32.4 24 32.4C27.5 32.4 30.4 31.2 32.3 28.8"
            stroke="url(#crecyLogoGrad)"
            strokeWidth="3.6"
            strokeLinecap="round"
          />

          {/* inner curve */}
          <path
            d="M24.2 16.4C21.5 16.4 19.2 18.3 18.8 20.9C18.2 24.5 21.1 27.6 24.5 27.6C26.6 27.6 28.2 26.9 29.4 25.5"
            stroke="url(#crecyLogoGrad)"
            strokeWidth="3.6"
            strokeLinecap="round"
          />

          {/* G bar */}
          <path
            d="M24.9 22H31.2"
            stroke="url(#crecyLogoGrad)"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <span className="brandLogoText">
        <span className="brandLogoTitle">CrecyStudio</span>
        {showTag ? (
          <span className="brandLogoSub">
            Websites • Automation • Portal Systems
          </span>
        ) : null}
      </span>
    </Link>
  );
}