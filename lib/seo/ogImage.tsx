import { ImageResponse } from "next/og";

// Shared OG-card renderer. Per-page opengraph-image.tsx files supply the
// headline + tagline; everything else (brand chrome, fonts, dimensions)
// lives here so a refresh to the visual identity is a one-file change.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png" as const;

const COLORS = {
  background: "#f6f7f8",
  surface: "#ffffff",
  ink: "#14171b",
  muted: "#626a73",
  line: "#cdd2d8",
  accent: "#c62f25",
};

// Social cards use the same two faces as the public Work in View site.
// Fetching at render time keeps font files out of the app bundle; Vercel
// caches generated cards, and module caching avoids duplicate fetches.
const fontCache = new Map<string, ArrayBuffer>();

async function loadGoogleFont(
  family: "Archivo" | "Archivo Narrow",
  weight: 400 | 600 | 700,
): Promise<ArrayBuffer> {
  const cacheKey = `${family}-${weight}`;
  const cached = fontCache.get(cacheKey);
  if (cached) return cached;

  const familyQuery = family.replace(/ /g, "+");
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${familyQuery}:wght@${weight}&display=swap`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/26.0.1410.65 Safari/537.36",
      },
    },
  ).then((response) => response.text());

  const sources = [
    ...css.matchAll(/src:\s*url\(([^)]+)\)\s*format\('([^']+)'\)/g),
  ];
  const preferred =
    sources.find(([, , format]) =>
      format === "truetype" || format === "opentype"
    ) ?? sources[0];

  if (!preferred) {
    throw new Error(`Failed to parse ${family} ${weight} from Google Fonts CSS`);
  }

  const response = await fetch(preferred[1]);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${family} ${weight}: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  fontCache.set(cacheKey, buffer);
  return buffer;
}

export async function renderOgImage(opts: {
  headline: string;
  tagline: string;
  // Optional eyebrow above the headline (e.g. "Case study" for /work/* OGs).
  eyebrow?: string;
}): Promise<ImageResponse> {
  const [displaySemibold, bodyRegular, bodyBold] = await Promise.all([
    loadGoogleFont("Archivo Narrow", 600),
    loadGoogleFont("Archivo", 400),
    loadGoogleFont("Archivo", 700),
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
          padding: "64px 76px",
          border: `1px solid ${COLORS.line}`,
          fontFamily: "Archivo",
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
                fontSize: 18,
                color: COLORS.muted,
                letterSpacing: 2.4,
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              {opts.eyebrow}
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontFamily: "Archivo Narrow",
              fontSize: 86,
              lineHeight: 0.92,
              fontWeight: 600,
              color: COLORS.ink,
              letterSpacing: -3.2,
              textTransform: "uppercase",
              maxWidth: 1020,
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

        {/* Work in View footer rule + accent marker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            borderTop: `1px solid ${COLORS.line}`,
            paddingTop: 18,
          }}
        >
          <div style={{ display: "flex", height: 4, width: 48, background: COLORS.accent }} />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Archivo Narrow", data: displaySemibold, weight: 600 },
        { name: "Archivo", data: bodyRegular, weight: 400 },
        { name: "Archivo", data: bodyBold, weight: 700 },
      ],
    }
  );
}
