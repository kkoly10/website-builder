import type { Metadata } from "next";

export function englishOnlyAlternates(path: string): Metadata["alternates"] {
  return {
    canonical: path,
    languages: {
      en: path,
      "en-US": path,
      "en-CA": path,
      "en-GB": path,
      "x-default": path,
    },
  };
}
