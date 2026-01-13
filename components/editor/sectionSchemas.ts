import { Section } from "@/lib/editorState";

export function getEditableFields(section: Section) {
  switch (section.type) {
    case "hero":
      return ["headline", "subheadline"];
    case "text":
      return ["body"];
    case "services":
      return ["items"];
    case "cta":
      return ["ctaText"];
    default:
      return [];
  }
}