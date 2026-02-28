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
            fill="#0f1220"
            stroke="#262a36"
          />
          <defs>
            <linearGradient id="crecyBrandGrad" x1="8" y1="8" x2="38" y2="38">
              <stop offset="0%" stopColor="#ff8c33" />
              <stop offset="100%" stopColor="#ff6b00" />
            </linearGradient>
          </defs>

          {/* Outer C */}
          <path
            d="M31.8 14.6C30 12.9 27.7 11.9 25 11.9C19.2 11.9 14.6 16.1 14 21.6C13.2 27.9 17.9 33.2 24.2 33.2C27.6 33.2 30.5 31.9 32.5 29.7"
            stroke="url(#crecyBrandGrad)"
            strokeWidth="3.7"
            strokeLinecap="round"
          />

          {/* Inner C / G curve */}
          <path
            d="M24.6 16.8C21.5 16.8 19 19 18.7 22C18.3 25.4 20.9 28.1 24.2 28.1C26.2 28.1 27.9 27.4 29.1 26"
            stroke="url(#crecyBrandGrad)"
            strokeWidth="3.7"
            strokeLinecap="round"
          />

          {/* G bar */}
          <path
            d="M25.2 22.9H31.6"
            stroke="url(#crecyBrandGrad)"
            strokeWidth="3.7"
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