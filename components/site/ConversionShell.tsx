import type { ReactNode } from "react";

// Shared visual scaffolding for narrow conversion pages: login, signup,
// forgot password, reset password, and the /estimate empty state. Provides
// the standard <main> wrapper, card frame, kicker + title + subtitle
// header, and an optional footer slot. Pages provide their own form or
// action content as children.
//
// This extraction does NOT redesign the pages — it just centralizes the
// shell so future visual updates land everywhere at once. Per the launch
// plan: "Don't redesign every auth page. Extract one shared shell."

export default function ConversionShell({
  kicker,
  title,
  subtitle,
  flash,
  children,
  footer,
  maxWidth = 440,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  flash?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}) {
  return (
    <main
      className="container"
      style={{ padding: "80px 0", maxWidth, margin: "0 auto" }}
    >
      <div className="card" style={{ border: "1px solid var(--accent)" }}>
        <div className="cardInner">
          <div>
            {kicker ? (
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                {kicker}
              </div>
            ) : null}
            <h1 className="h2">{title}</h1>
            {subtitle ? (
              <p className="pDark" style={{ marginTop: 6 }}>
                {subtitle}
              </p>
            ) : null}
          </div>

          {flash ? (
            <div
              style={{
                borderRadius: 8,
                padding: 12,
                border: "1px solid var(--stroke)",
                background: "var(--panel2)",
                color: "var(--fg)",
                fontSize: 13,
              }}
            >
              {flash}
            </div>
          ) : null}

          {children}

          {footer ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--stroke)",
                paddingTop: 16,
                marginTop: 8,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
