import type { MetadataRoute } from "next";

// Web App Manifest — surfaced when a user installs the site as a PWA, and
// read by some platforms for install prompts / theme color. Icons reference
// the existing app/icon.svg and the generated /apple-icon route so we don't
// commit raster duplicates.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CrecyStudio",
    short_name: "Crecy",
    description:
      "Independent web studio building premium websites, custom web systems, and AI-powered products.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f8",
    theme_color: "#c62f25",
    icons: [
      // Modern browsers prefer SVG when offered.
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
