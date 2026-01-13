"use client";

import { PageType, Section } from "@/lib/editorState";
import { getEditableFields } from "./sectionSchemas";

type Props = {
  currentPage: PageType;
  setPage: (p: PageType) => void;
  selectedSection: Section | null;
  updateSection: (field: string, value: any) => void;
};

export default function Sidebar({
  currentPage,
  setPage,
  selectedSection,
  updateSection,
}: Props) {
  return (
    <aside style={{ width: 300, borderRight: "1px solid #e5e7eb", padding: 16 }}>
      <h3>Pages</h3>
      {(["home", "about", "services", "contact"] as PageType[]).map((p) => (
        <button
          key={p}
          onClick={() => setPage(p)}
          style={{
            display: "block",
            marginBottom: 8,
            fontWeight: currentPage === p ? 600 : 400,
          }}
        >
          {p.toUpperCase()}
        </button>
      ))}

      <hr style={{ margin: "16px 0" }} />

      <h3>Section Editor</h3>

      {!selectedSection && (
        <p style={{ color: "#666" }}>Select a section to edit</p>
      )}

      {selectedSection &&
        getEditableFields(selectedSection).map((field) => (
          <div key={field} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 14 }}>{field}</label>

            {Array.isArray((selectedSection.content as any)[field]) ? (
              ((selectedSection.content as any)[field] as string[]).map(
                (item: string, i: number) => (
                  <input
                    key={i}
                    value={item}
                    onChange={(e) => {
                      const updated = [
                        ...(selectedSection.content as any)[field],
                      ];
                      updated[i] = e.target.value;
                      updateSection(field, updated);
                    }}
                    style={{ width: "100%", padding: 8, marginBottom: 6 }}
                  />
                )
              )
            ) : (
              <textarea
                value={(selectedSection.content as any)[field] || ""}
                onChange={(e) => updateSection(field, e.target.value)}
                style={{ width: "100%", padding: 8 }}
              />
            )}
          </div>
        ))}
    </aside>
  );
}