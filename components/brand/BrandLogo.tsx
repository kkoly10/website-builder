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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 280 50"
        height={28}
        width={157}
        aria-hidden="true"
        style={{ display: "block" }}
      >
        <g transform="translate(0,2)">
          <path d="M4 2 L4 34 L12 26 L22 40 L28 36 L18 22 L30 20 Z" fill="#1a1210" />
          <circle cx="8" cy="40" r="3" fill="#c43e2b" />
        </g>
        <text x="50" y="33" fill="#1a1210" fontSize={28} fontWeight={600} fontFamily="var(--font-display, 'Sora', sans-serif)" letterSpacing="-0.8">crecy</text>
        <text x="132" y="33" fill="#8a7d74" fontSize={28} fontWeight={300} fontFamily="var(--font-display, 'Sora', sans-serif)" letterSpacing="-0.8">studio</text>
      </svg>
      {showTag ? (
        <span className="brandLogoSub">Websites / automation / systems</span>
      ) : null}
    </Link>
  );
}
