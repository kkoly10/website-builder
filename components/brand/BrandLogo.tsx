// components/brand/BrandLogo.tsx
import Link from "next/link";

export default function BrandLogo({
  href = "/",
  showTag = true,
}: {
  href?: string;
  showTag?: boolean;
}) {
  return (
    <Link href={href} className="brandLogo" aria-label="CrecyStudio home">
      <span className="brandLogoMark" aria-hidden="true">
        <svg
          width="34"
          height="34"
          viewBox="0 0 34 34"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="crecyOrange" x1="4" y1="4" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFB15A" />
              <stop offset="0.55" stopColor="#FF7A18" />
              <stop offset="1" stopColor="#E45800" />
            </linearGradient>
          </defs>

          <rect
            x="1.25"
            y="1.25"
            width="31.5"
            height="31.5"
            rx="10.5"
            fill="rgba(255,255,255,0.02)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
          />

          {/* stylized C/S orbit mark */}
          <path
            d="M23.7 10.8c-1.8-2.2-4.4-3.4-7.3-3.4-5.2 0-9.3 4.1-9.3 9.3s4.1 9.3 9.3 9.3c2.9 0 5.5-1.3 7.3-3.4"
            stroke="url(#crecyOrange)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M20.9 13.1c-1.1-1.2-2.6-1.9-4.4-1.9-3.1 0-5.6 2.5-5.6 5.6s2.5 5.6 5.6 5.6c1.7 0 3.3-.8 4.4-1.9"
            stroke="url(#crecyOrange)"
            strokeOpacity="0.95"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M21.8 10.7h4.2"
            stroke="url(#crecyOrange)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M21.8 23.3h4.2"
            stroke="url(#crecyOrange)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <span className="brandLogoText">
        <span className="brandLogoTitle">CrecyStudio</span>
        {showTag ? <span className="brandLogoSub">Custom Websites</span> : null}
      </span>
    </Link>
  );
}