import { ImageResponse } from "next/og";

// Shared OG-card renderer. Per-page opengraph-image.tsx files supply the
// headline + tagline; everything else (brand chrome, fonts, dimensions)
// lives here so a refresh to the visual identity is a one-file change.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png" as const;

const COLORS = {
  background: "#FAFAF7",
  ink: "#1a1210",
  muted: "#8a7d74",
  accent: "#c43e2b",
};

// Inter Tight is the site's display font (app/globals.css line 22). Fetching
// at render time avoids dragging webpack/turbopack config in to bundle a
// TTF; Vercel caches the rendered PNG so this fetch only runs on first
// generation per (locale, headline) pair. Inside a warm container we cache
// the buffer in module scope so repeat renders skip the fetch entirely.
const fontCache: Partial<Record<400 | 700, ArrayBuffer>> = {};

async function loadInterTight(weight: 400 | 700): Promise<ArrayBuffer> {
  if (fontCache[weight]) return fontCache[weight]!;

  // Older UA forces Google Fonts to serve TTF rather than WOFF2 — Satori's
  // WOFF2 support is version-dependent and silently falling back to "no
  // font found" produces a blank-looking OG card. TTF is universally safe.
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter+Tight:wght@${weight}&display=swap`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/26.0.1410.65 Safari/537.36",
      },
    }
  ).then((r) => r.text());

  // Prefer truetype/opentype URLs over woff/woff2 in case the CSS still
  // contains multiple formats. Walk all `src: url(...) format('...')`
  // declarations and pick the first ttf/otf.
  const sources = [...css.matchAll(/src:\s*url\(([^)]+)\)\s*format\('([^']+)'\)/g)];
  const preferred =
    sources.find(([, , fmt]) => fmt === "truetype" || fmt === "opentype") ?? sources[0];
  if (!preferred) {
    throw new Error(`Failed to parse Inter Tight ${weight} from Google Fonts CSS`);
  }

  const res = await fetch(preferred[1]);
  if (!res.ok) throw new Error(`Failed to fetch Inter Tight ${weight}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  fontCache[weight] = buffer;
  return buffer;
}

export async function renderOgImage(opts: {
  headline: string;
  tagline: string;
  // Optional eyebrow above the headline (e.g. "Case study" for /work/* OGs).
  eyebrow?: string;
}): Promise<ImageResponse> {
  const [interBold, interRegular] = await Promise.all([
    loadInterTight(700),
    loadInterTight(400),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: COLORS.background,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 96px",
          fontFamily: "Inter Tight",
        }}
      >
        {/* Top row: brand mark + crecystudio wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="44" height="54" viewBox="0 0 36 44">
            <path
              d="M4 2 L4 34 L12 26 L22 40 L28 36 L18 22 L30 20 Z"
              fill={COLORS.ink}
            />
            <circle cx="8" cy="40" r="3" fill={COLORS.accent} />
          </svg>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: COLORS.ink, letterSpacing: -1 }}>
            <span>crecy</span>
            <span style={{ color: COLORS.muted, fontWeight: 400, marginLeft: 4 }}>studio</span>
          </div>
        </div>

        {/* Middle: optional eyebrow + headline + tagline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {opts.eyebrow && (
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: COLORS.accent,
                letterSpacing: 2,
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              {opts.eyebrow}
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: 76,
              lineHeight: 1.05,
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: -2.5,
              maxWidth: 980,
            }}
          >
            {opts.headline}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 30,
              fontWeight: 400,
              color: COLORS.muted,
              letterSpacing: -0.5,
              maxWidth: 980,
            }}
          >
            {opts.tagline}
          </div>
        </div>

        {/* Brand accent stripe */}
        <div style={{ display: "flex", height: 6, width: 96, background: COLORS.accent }} />
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter Tight", data: interBold, weight: 700 },
        { name: "Inter Tight", data: interRegular, weight: 400 },
      ],
    }
  );
}
