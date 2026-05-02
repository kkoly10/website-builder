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
      <img
        src="/brand/crecy-d1-horizontal-dark.svg"
        alt="Crecy Studio"
        height={28}
        width={157}
        style={{ display: "block" }}
      />
      {showTag ? (
        <span className="brandLogoSub">Websites / automation / systems</span>
      ) : null}
    </Link>
  );
}
