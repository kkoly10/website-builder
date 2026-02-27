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
        <img
          src="/brand/crecy_logo_header_tight.png"
          alt="CrecyStudio"
          width={1050}
          height={282}
          style={{ width: 190, height: "auto" }}
        />
      </span>

      {showTag ? (
        <span className="brandLogoText">
          <span className="brandLogoSub">Websites • Automation • Portal Systems</span>
        </span>
      ) : null}
    </Link>
  );
}
