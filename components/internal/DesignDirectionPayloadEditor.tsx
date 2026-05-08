"use client";

import { useState } from "react";
import type { WebsiteDesignDirection } from "@/lib/designDirection";

// Editable subset of the design-direction payload. Mirrors the
// whitelist on the server (DESIGN_DIRECTION_EDITABLE_KEYS in
// lib/customerPortal.ts). We expose only the free-text and CSV-list
// fields here — those are 80% of the typo-fix targets. Object-array
// fields (likedWebsites/dislikedWebsites) and typed unions
// (controlLevel/brandColorsKnown/hasLogo/hasBrandGuide) need richer
// UX; admin can patch those via fetch directly until that's added.

type Props = {
  quoteId: string;
  designDirection: WebsiteDesignDirection;
  onSaved: (next: WebsiteDesignDirection) => void;
};

function csvIn(value: string[] | null | undefined): string {
  return Array.isArray(value) ? value.join(", ") : "";
}

function csvOut(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function DesignDirectionPayloadEditor({
  quoteId,
  designDirection,
  onSaved,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    visualStyle: designDirection.visualStyle ?? "",
    preferredColors: designDirection.preferredColors ?? "",
    colorsToAvoid: designDirection.colorsToAvoid ?? "",
    typographyFeel: designDirection.typographyFeel ?? "",
    brandAssetsNotes: designDirection.brandAssetsNotes ?? "",
    clientNotes: designDirection.clientNotes ?? "",
    brandMood: csvIn(designDirection.brandMood),
    imageryDirection: csvIn(designDirection.imageryDirection),
    contentTone: csvIn(designDirection.contentTone),
  });

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const patch = {
        visualStyle: draft.visualStyle.trim(),
        preferredColors: draft.preferredColors.trim(),
        colorsToAvoid: draft.colorsToAvoid.trim(),
        typographyFeel: draft.typographyFeel.trim(),
        brandAssetsNotes: draft.brandAssetsNotes.trim(),
        clientNotes: draft.clientNotes.trim(),
        brandMood: csvOut(draft.brandMood),
        imageryDirection: csvOut(draft.imageryDirection),
        contentTone: csvOut(draft.contentTone),
      };
      const res = await fetch("/api/internal/portal/admin-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, designDirectionEdit: { patch } }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to save.");
      if (json.designDirection) onSaved(json.designDirection as WebsiteDesignDirection);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button
        type="button"
        className="btn btnGhost"
        onClick={() => setOpen((o) => !o)}
        style={{ fontSize: 12, padding: "8px 14px" }}
      >
        {open ? "Cancel edit" : "Edit submitted answers →"}
      </button>

      {open ? (
        <div style={{ marginTop: 12, padding: 16, border: "1px solid var(--rule)", borderRadius: 12, background: "var(--paper)", display: "grid", gap: 14 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
            Fix typos or fill in answers the client sent over email. Only free-text and list fields are editable here. Changes are logged with <code>design_direction_payload_edited</code>; status and timestamps are not affected.
          </div>

          <Field label="Visual style">
            <textarea className="textarea" rows={2} value={draft.visualStyle} onChange={(e) => setDraft((p) => ({ ...p, visualStyle: e.target.value }))} disabled={busy} />
          </Field>
          <Field label="Brand mood (comma separated)">
            <input className="input" value={draft.brandMood} onChange={(e) => setDraft((p) => ({ ...p, brandMood: e.target.value }))} disabled={busy} />
          </Field>
          <Field label="Preferred colors">
            <input className="input" value={draft.preferredColors} onChange={(e) => setDraft((p) => ({ ...p, preferredColors: e.target.value }))} disabled={busy} />
          </Field>
          <Field label="Colors to avoid">
            <input className="input" value={draft.colorsToAvoid} onChange={(e) => setDraft((p) => ({ ...p, colorsToAvoid: e.target.value }))} disabled={busy} />
          </Field>
          <Field label="Typography feel">
            <input className="input" value={draft.typographyFeel} onChange={(e) => setDraft((p) => ({ ...p, typographyFeel: e.target.value }))} disabled={busy} />
          </Field>
          <Field label="Imagery direction (comma separated)">
            <input className="input" value={draft.imageryDirection} onChange={(e) => setDraft((p) => ({ ...p, imageryDirection: e.target.value }))} disabled={busy} />
          </Field>
          <Field label="Content tone (comma separated)">
            <input className="input" value={draft.contentTone} onChange={(e) => setDraft((p) => ({ ...p, contentTone: e.target.value }))} disabled={busy} />
          </Field>
          <Field label="Brand assets notes">
            <textarea className="textarea" rows={2} value={draft.brandAssetsNotes} onChange={(e) => setDraft((p) => ({ ...p, brandAssetsNotes: e.target.value }))} disabled={busy} />
          </Field>
          <Field label="Client notes">
            <textarea className="textarea" rows={3} value={draft.clientNotes} onChange={(e) => setDraft((p) => ({ ...p, clientNotes: e.target.value }))} disabled={busy} />
          </Field>

          {error ? (
            <div style={{ fontSize: 12, color: "var(--accent)", padding: "8px 12px", border: "1px solid var(--accent)", borderRadius: 8 }}>
              {error}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn btnGhost" disabled={busy} onClick={() => setOpen(false)} style={{ fontSize: 12, padding: "8px 14px" }}>
              Cancel
            </button>
            <button type="button" className="btn btnPrimary" disabled={busy} onClick={save} style={{ fontSize: 12, padding: "8px 14px" }}>
              {busy ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700 }}>
        {label}
      </span>
      {children}
    </label>
  );
}
