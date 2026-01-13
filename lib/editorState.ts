export type PageType = "home" | "about" | "services" | "contact";

export type SectionContent = {
  headline?: string;
  subheadline?: string;
  body?: string;
  items?: string[];
  ctaText?: string;
};

export type Section = {
  id: string;
  type: "hero" | "text" | "services" | "cta";
  content: SectionContent;
};

export type Page = {
  type: PageType;
  sections: Section[];
};

export type EditorSite = {
  name: string;
  pages: Record<PageType, Page>;
};

export function createInitialSite(): EditorSite {
  return {
    name: "My Website",
    pages: {
      home: {
        type: "home",
        sections: [
          {
            id: "hero",
            type: "hero",
            content: {
              headline: "Welcome to My Website",
              subheadline: "Describe your business in one clear sentence",
            },
          },
          {
            id: "cta",
            type: "cta",
            content: {
              ctaText: "Get Started",
            },
          },
        ],
      },
      about: {
        type: "about",
        sections: [
          {
            id: "about-text",
            type: "text",
            content: {
              body: "Tell people about your business, your story, and your values.",
            },
          },
        ],
      },
      services: {
        type: "services",
        sections: [
          {
            id: "services-list",
            type: "services",
            content: {
              items: ["Service One", "Service Two", "Service Three"],
            },
          },
        ],
      },
      contact: {
        type: "contact",
        sections: [
          {
            id: "contact-text",
            type: "text",
            content: {
              body: "Let people know how to reach you.",
            },
          },
        ],
      },
    },
  };
}