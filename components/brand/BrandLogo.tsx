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
        CS
      </span>
      <span className="brandLogoText">
        <span className="brandLogoTitle">
          crecy<span className="brandLogoDot">.</span>studio
        </span>
        {showTag ? (
          <span className="brandLogoSub">
            Websites &bull; Automation &bull; Systems
          </span>
        ) : null}
      </span>
    </Link>
  );
}
