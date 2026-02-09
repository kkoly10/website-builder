import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Website Builder — Modern websites that convert",
  description:
    "Modern, conversion-focused websites with transparent pricing and a clean build process.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Global background shared across Home + Estimate + etc. */}
        <div className="appBg" aria-hidden="true">
          <div className="appGrid" />
          <div className="appBlob appBlob1" />
          <div className="appBlob appBlob2" />
          <div className="appNoise" />
        </div>

        <div className="appShell">{children}</div>
      </body>
    </html>
  );
}
