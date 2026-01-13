"use client";

import { useState } from "react";
import {
  createInitialSite,
  EditorSite,
  PageType,
  Section,
} from "@/lib/editorState";
import Sidebar from "./Sidebar";
import Preview from "./Preview";

export default function EditorShell() {
  const [site, setSite] = useState<EditorSite>(createInitialSite());
  const [page, setPage] = useState<PageType>("home");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );

  const currentPage = site.pages[page];
  const selectedSection =
    currentPage.sections.find((s) => s.id === selectedSectionId) || null;

  function updateSection(field: string, value: any) {
    setSite((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [page]: {
          ...prev.pages[page],
          sections: prev.pages[page].sections.map((s) =>
            s.id === selectedSectionId
              ? { ...s, content: { ...s.content, [field]: value } }
              : s
          ),
        },
      },
    }));
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        currentPage={page}
        setPage={setPage}
        selectedSection={selectedSection}
        updateSection={updateSection}
      />

      <main style={{ flex: 1, overflow: "auto" }}>
        <Preview page={currentPage} selectSection={setSelectedSectionId} />
      </main>
    </div>
  );
}