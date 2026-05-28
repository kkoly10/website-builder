// Visual helpers for the design-direction form (Task 6).
//
// Three rendering primitives, all inline (no extra HTTP requests, no
// external assets to license or curate per project):
//
// 1. StyleSketch — small layout SVG per visual-style option
// 2. TypeSample — "Aa" rendered in a font stack representing each feel
// 3. ImageryGlyph — small icon per imagery direction
//
// Brand-mood visuals are deferred (per the upgrade plan): moods are
// inherently abstract and a color swatch alone doesn't add much signal.

import type { CSSProperties } from "react";

const SKETCH_BOX: CSSProperties = {
  width: 28,
  height: 20,
  flexShrink: 0,
  display: "block",
};

// ─── StyleSketch ──────────────────────────────────────────────────────────
// Each sketch is a 32×24 viewBox showing a layout pattern. Strokes use
// currentColor so the sketch inherits the pill's foreground color
// (selected = accent-2; unselected = fg).

export function StyleSketch({ sketch }: { sketch: string }) {
  const stroke = "currentColor";
  switch (sketch) {
    case "clean-pro":
      // Header bar + 3 even content blocks → clean grid.
      return (
        <svg viewBox="0 0 32 24" style={SKETCH_BOX} aria-hidden>
          <rect x="2" y="2" width="28" height="3" fill={stroke} opacity="0.7" />
          <rect x="2" y="8" width="8" height="14" fill="none" stroke={stroke} strokeWidth="1" />
          <rect x="12" y="8" width="8" height="14" fill="none" stroke={stroke} strokeWidth="1" />
          <rect x="22" y="8" width="8" height="14" fill="none" stroke={stroke} strokeWidth="1" />
        </svg>
      );
    case "bold-prem":
      // Large hero block + smaller row → bold premium.
      return (
        <svg viewBox="0 0 32 24" style={SKETCH_BOX} aria-hidden>
          <rect x="2" y="2" width="28" height="13" fill={stroke} opacity="0.8" />
          <rect x="2" y="17" width="13" height="5" fill="none" stroke={stroke} strokeWidth="1" />
          <rect x="17" y="17" width="13" height="5" fill="none" stroke={stroke} strokeWidth="1" />
        </svg>
      );
    case "warm-friendly":
      // Rounded blocks → softer feel.
      return (
        <svg viewBox="0 0 32 24" style={SKETCH_BOX} aria-hidden>
          <rect x="2" y="2" width="28" height="8" rx="3" fill={stroke} opacity="0.7" />
          <rect x="2" y="12" width="13" height="10" rx="3" fill="none" stroke={stroke} strokeWidth="1" />
          <rect x="17" y="12" width="13" height="10" rx="3" fill="none" stroke={stroke} strokeWidth="1" />
        </svg>
      );
    case "modern-tech":
      // Tight grid → technical/dense.
      return (
        <svg viewBox="0 0 32 24" style={SKETCH_BOX} aria-hidden>
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={2 + col * 7}
                y={2 + row * 7}
                width="6"
                height="6"
                fill="none"
                stroke={stroke}
                strokeWidth="1"
              />
            )),
          )}
        </svg>
      );
    case "luxury-editorial":
      // Asymmetric split → editorial.
      return (
        <svg viewBox="0 0 32 24" style={SKETCH_BOX} aria-hidden>
          <rect x="2" y="2" width="12" height="20" fill={stroke} opacity="0.8" />
          <rect x="16" y="2" width="14" height="9" fill="none" stroke={stroke} strokeWidth="1" />
          <rect x="16" y="13" width="14" height="9" fill="none" stroke={stroke} strokeWidth="1" />
        </svg>
      );
    case "local-trust":
      // Header + hero + grid → traditional trust layout.
      return (
        <svg viewBox="0 0 32 24" style={SKETCH_BOX} aria-hidden>
          <rect x="2" y="2" width="28" height="2" fill={stroke} opacity="0.5" />
          <rect x="2" y="6" width="28" height="7" fill={stroke} opacity="0.7" />
          <rect x="2" y="15" width="8" height="7" fill="none" stroke={stroke} strokeWidth="1" />
          <rect x="12" y="15" width="8" height="7" fill="none" stroke={stroke} strokeWidth="1" />
          <rect x="22" y="15" width="8" height="7" fill="none" stroke={stroke} strokeWidth="1" />
        </svg>
      );
    case "creative-portfolio":
      // Asymmetric blocks → creative portfolio.
      return (
        <svg viewBox="0 0 32 24" style={SKETCH_BOX} aria-hidden>
          <rect x="2" y="2" width="11" height="12" fill={stroke} opacity="0.8" />
          <rect x="15" y="2" width="15" height="8" fill="none" stroke={stroke} strokeWidth="1" />
          <rect x="15" y="12" width="7" height="10" fill="none" stroke={stroke} strokeWidth="1" />
          <rect x="24" y="12" width="6" height="10" fill={stroke} opacity="0.4" />
          <rect x="2" y="16" width="11" height="6" fill="none" stroke={stroke} strokeWidth="1" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── TypeSample ───────────────────────────────────────────────────────────
// Renders "Aa" in a font stack representing each typography feel. Uses
// system fonts only so nothing extra has to be loaded.

const TYPE_STYLE: Record<string, CSSProperties> = {
  "modern-clean": {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontWeight: 500,
    letterSpacing: "-0.02em",
  },
  "elegant-premium": {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontStyle: "italic",
    fontWeight: 400,
  },
  "bold-strong": {
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },
  "friendly-approachable": {
    fontFamily: "'Avenir', 'Nunito', 'Trebuchet MS', sans-serif",
    fontWeight: 600,
    letterSpacing: "0",
  },
  "technical-minimal": {
    fontFamily: "'JetBrains Mono', 'Menlo', 'Courier New', monospace",
    fontWeight: 500,
    letterSpacing: "-0.01em",
  },
  "follow-brand": {
    fontFamily: "system-ui, sans-serif",
    fontStyle: "italic",
    opacity: 0.5,
  },
  "studio-choose": {
    fontFamily: "system-ui, sans-serif",
    opacity: 0.4,
  },
};

const TYPE_GLYPH: Record<string, string> = {
  "follow-brand": "—",
  "studio-choose": "?",
};

export function TypeSample({ sample }: { sample: string }) {
  const style = TYPE_STYLE[sample];
  if (!style) return null;
  const glyph = TYPE_GLYPH[sample] ?? "Aa";
  return (
    <span
      aria-hidden
      style={{
        ...style,
        fontSize: 16,
        lineHeight: 1,
        minWidth: 28,
        textAlign: "center",
        flexShrink: 0,
        color: "currentColor",
      }}
    >
      {glyph}
    </span>
  );
}

// ─── ImageryGlyph ─────────────────────────────────────────────────────────
// Small line-icon SVGs (20×20) per imagery direction option.

export function ImageryGlyph({ glyph }: { glyph: string }) {
  const stroke = "currentColor";
  const box: CSSProperties = { width: 20, height: 20, flexShrink: 0, display: "block" };
  switch (glyph) {
    case "real-photo":
      // Camera with shutter circle.
      return (
        <svg viewBox="0 0 20 20" style={box} aria-hidden>
          <rect x="1" y="6" width="18" height="11" rx="2" fill="none" stroke={stroke} strokeWidth="1.4" />
          <rect x="7" y="3" width="6" height="3" rx="1" fill="none" stroke={stroke} strokeWidth="1.4" />
          <circle cx="10" cy="11" r="3" fill="none" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
    case "stock-photo":
      // Stacked cards.
      return (
        <svg viewBox="0 0 20 20" style={box} aria-hidden>
          <rect x="4" y="2" width="14" height="11" rx="1" fill="none" stroke={stroke} strokeWidth="1.4" />
          <rect x="2" y="6" width="14" height="11" rx="1" fill="none" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
    case "person":
      // Head + shoulders.
      return (
        <svg viewBox="0 0 20 20" style={box} aria-hidden>
          <circle cx="10" cy="7" r="3.5" fill="none" stroke={stroke} strokeWidth="1.4" />
          <path d="M3 18 C3 13, 17 13, 17 18" fill="none" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
    case "product":
      // Box.
      return (
        <svg viewBox="0 0 20 20" style={box} aria-hidden>
          <path d="M3 6 L10 3 L17 6 L17 14 L10 17 L3 14 Z" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M3 6 L10 9 L17 6" fill="none" stroke={stroke} strokeWidth="1.4" />
          <path d="M10 9 L10 17" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
    case "before-after":
      // Split rectangle.
      return (
        <svg viewBox="0 0 20 20" style={box} aria-hidden>
          <rect x="2" y="4" width="16" height="12" fill="none" stroke={stroke} strokeWidth="1.4" />
          <line x1="10" y1="4" x2="10" y2="16" stroke={stroke} strokeWidth="1.4" />
          <rect x="3" y="5" width="6" height="10" fill={stroke} opacity="0.25" />
        </svg>
      );
    case "icons":
      // Grid of small dots.
      return (
        <svg viewBox="0 0 20 20" style={box} aria-hidden>
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <circle
                key={`${r}-${c}`}
                cx={4 + c * 6}
                cy={4 + r * 6}
                r="1.5"
                fill={stroke}
              />
            )),
          )}
        </svg>
      );
    case "illustration":
      // Pencil/brush stroke.
      return (
        <svg viewBox="0 0 20 20" style={box} aria-hidden>
          <path d="M3 17 L13 7 L16 10 L6 20 Z" transform="translate(0, -3)" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M12 4 L16 8" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
    case "phone":
      // Phone frame.
      return (
        <svg viewBox="0 0 20 20" style={box} aria-hidden>
          <rect x="6" y="2" width="8" height="16" rx="1.5" fill="none" stroke={stroke} strokeWidth="1.4" />
          <line x1="6" y1="5" x2="14" y2="5" stroke={stroke} strokeWidth="1.4" />
          <circle cx="10" cy="16" r="0.8" fill={stroke} />
        </svg>
      );
    case "minimal":
      // Empty frame with single dot.
      return (
        <svg viewBox="0 0 20 20" style={box} aria-hidden>
          <rect x="2" y="4" width="16" height="12" fill="none" stroke={stroke} strokeWidth="1.4" strokeDasharray="2 2" />
          <circle cx="10" cy="10" r="1.2" fill={stroke} />
        </svg>
      );
    default:
      return null;
  }
}
