import ComingLaterLink from "./ComingLaterLink";

export default function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid #E5E7EB",
        padding: "24px 16px",
        marginTop: 40,
        background: "#fff",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 900, color: "#111827" }}>Your Brand</div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a
              href="mailto:your@email.com"
              style={{ color: "#6B7280", textDecoration: "none", fontWeight: 700, fontSize: 13 }}
            >
              your@email.com
            </a>

            <ComingLaterLink />
          </div>
        </div>

        <div style={{ marginTop: 12, color: "#9CA3AF", fontSize: 12 }}>
          © {new Date().getFullYear()} · All rights reserved
        </div>
      </div>
    </footer>
  );
}
