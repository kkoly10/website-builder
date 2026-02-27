// components/brand/BrandLogo.tsx
import Image from "next/image";
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
        <Image
          src="/brand/logo-a.svg"
          alt="CrecyStudio"
          width={168}
          height={56}
          priority
          style={{ width: 132, height: "auto" }}
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
