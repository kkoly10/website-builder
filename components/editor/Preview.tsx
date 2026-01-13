"use client";

import { Page } from "../../lib/editorState";

type Props = {
  page: Page;
  selectSection: (id: string) => void;
};

export default function Preview({ page, selectSection }: Props) {
  return (
    <div style={{ padding: 24 }}>
      {page.sections.map((section) => (
        <div
          key={section.id}
          onClick={() => selectSection(section.id)}
          style={{
            border: "1px dashed #ccc",
            padding: 16,
            marginBottom: 16,
            cursor: "pointer",
          }}
        >
          {section.type === "hero" && (
            <>
              <h1>{section.content.headline}</h1>
              <p>{section.content.subheadline}</p>
            </>
          )}

          {section.type === "text" && <p>{section.content.body}</p>}

          {section.type === "services" && (
            <ul>
              {(section.content.items || []).map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          )}

          {section.type === "cta" && (
            <button>{section.content.ctaText}</button>
          )}
        </div>
      ))}
    </div>
  );
}