import { ImageResponse } from "next/og";

// 180x180 PNG generated on demand. iOS uses this for Add-to-Home-Screen
// bookmarks; without it iOS falls back to a screenshot, which looks
// shabby. Renders once and gets cached by Vercel — Node runtime keeps
// parity with the OG-image route (Edge would also work since no fs).
export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1a1210",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="105" height="128" viewBox="0 0 36 44">
          <path
            d="M4 2 L4 34 L12 26 L22 40 L28 36 L18 22 L30 20 Z"
            fill="#f8f1e8"
          />
          <circle cx="8" cy="40" r="3" fill="#c43e2b" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
