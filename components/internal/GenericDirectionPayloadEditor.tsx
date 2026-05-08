"use client";

import { useState } from "react";
import type { GenericDirection } from "@/lib/directions/types";
import { getDirectionSchema, type FieldDef } from "@/lib/directions/schemas";

// Schema-driven payload editor for non-website lanes (web_app /
// automation / ecommerce / rescue). Iterates over the lane's
// FieldDef[] from getDirectionSchema and renders the appropriate
// input per type. Pills-multi and select are rendered as text
// inputs (CSV / single value) for editing simplicity — the dedicated
// client-side DirectionForm has the real pickers; this admin path is
// for typo fixes and fill-ins.

type Props = {
  quoteId: string;
  direction: GenericDirection;
  onSaved: (next: GenericDirection) => void;
};

function asString(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(String).join(", ");
  return String(v);
}

function csvOut(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function GenericDirectionPayloadEditor({
  quoteId,
  direction,
  onSaved,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = getDirectionSchema(direction.type);
  const initial: Record<string, string> = {};
  if (schema) {
    for (const field of schema.fields) {
      initial[field.key] = asString((direction.payload as Record<string, unknown>)[field.key]);
    }
  }
  const [draft, setDraft] = useState(initial);

  if (!schema) {
    return null;
  }

  async function save() {
    if (!schema) return;
    setBusy(true);
    setError(null);
    try {
      // Reshape draft back into the typed payload. CSV fields → arrays,
      // text/textarea → strings, select → string. The server-side
      // helper merges this onto the existing payload, so unspecified
      // fields stay untouched.
      const payload: Record<string, unknown> = {};
      for (const field of schema.fields) {
        const raw = draft[field.key] ?? "";
        if (field.type === "pills-multi") {
          payload[field.key] = csvOut(raw);
        } else {
          payload[field.key] = raw.trim();
        }
      }
      const res = await fetch("/api/internal/portal/admin-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, directionEdit: { payload } }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to save.");
      if (json.direction) onSaved(json.direction as GenericDirection);
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
            Fix typos or fill in answers the client sent over email. Logged as <code>{direction.type}_payload_edited</code>; status and timestamps are not affected.
          </div>
          {schema.fields.map((field) => (
            <FieldRow
              key={field.key}
              field={field}
              value={draft[field.key] ?? ""}
              onChange={(v) => setDraft((p) => ({ ...p, [field.key]: v }))}
              disabled={busy}
            />
          ))}

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

function FieldRow({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FieldDef;
  value: string;
  onChange: (next: string) => void;
  disabled: boolean;
}) {
  const labelEl = (
    <span style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700 }}>
      {field.label}
      {field.helpText ? (
        <span style={{ display: "block", fontSize: 10, color: "var(--muted-2)", textTransform: "none", letterSpacing: "normal", marginTop: 2 }}>
          {field.helpText}
        </span>
      ) : null}
    </span>
  );

  if (field.type === "textarea") {
    return (
      <label style={{ display: "grid", gap: 6 }}>
        {labelEl}
        <textarea className="textarea" rows={3} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
      </label>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <label style={{ display: "grid", gap: 6 }}>
        {labelEl}
        <select className="select" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
          <option value="">—</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "pills-multi") {
    return (
      <label style={{ display: "grid", gap: 6 }}>
        {labelEl}
        <input
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={field.options ? `Comma separated (${field.options.slice(0, 3).join(", ")}...)` : "Comma separated"}
        />
      </label>
    );
  }

  return (
    <label style={{ display: "grid", gap: 6 }}>
      {labelEl}
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </label>
  );
}
