import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          background: "#f9f9f9",
          color: "#111",
        }}
      >
        {children}

        {/* FOOTER */}
        <footer
          style={{
            marginTop: 100,
            borderTop: "1px solid #e5e5e5",
            padding: "32px 24px",
            background: "#fff",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 600 }}>
              © {new Date().getFullYear()} · Website Builder
            </div>

            <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
              <Link
                href="/coming-soon"
                style={{
                  color: "#666",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Exploring E-Commerce Support · Coming Later
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
