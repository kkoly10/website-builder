"use client";

import { useState, type FormEvent } from "react";
import type { FieldDef, DirectionSchema } from "@/lib/directions/schemas";
import type { GenericDirectionInput } from "@/lib/directions/types";

type Props = {
  schema: DirectionSchema;
  initialPayload: Record<string, unknown>;
  saving: boolean;
  error: string | null;
  // Optional copy override per lane. The card passes through lane-specific
  // approval terms text.
  approvalTermsLabel?: string;
  onSubmit: (value: GenericDirectionInput) => Promise<void> | void;
};

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

// String-list (tag-style) input. Add by Enter; remove by clicking ✕.
function StringListInput({
  value,
  onChange,
  max,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  max: number;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setDraft("");
      return;
    }
    if (value.length >= max) return;
    onChange([...value, trimmed]);
    setDraft("");
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {value.map((tag) => (
          <span
            key={tag}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: 999,
              border: "1px solid var(--rule)",
              background: "var(--paper-2)",
              fontSize: 12,
              color: "var(--fg)",
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== tag))}
              aria-label={`Remove ${tag}`}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--muted)",
                cursor: "pointer",
                padding: 0,
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <input
        className="input"
        type="text"
        value={draft}
        placeholder={placeholder ?? `Add and press Enter (max ${max})`}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={() => commit()}
        disabled={value.length >= max}
      />
    </div>
  );
}

function PillsMulti({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              onChange(
                selected
                  ? value.filter((v) => v !== option)
                  : [...value, option],
              );
            }}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid",
              borderColor: selected ? "var(--accent)" : "var(--rule)",
              background: selected ? "var(--accent-bg)" : "var(--paper-2)",
              color: selected ? "var(--accent-2)" : "var(--fg)",
              fontSize: 13,
              fontWeight: selected ? 700 : 500,
              cursor: "pointer",
              transition: "all 120ms ease",
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label className="fieldLabel">
        {field.label}
        {field.required ? (
          <span style={{ color: "var(--accent-2)", marginLeft: 4 }}>*</span>
        ) : null}
      </label>
      {field.type === "text" ? (
        <input
          className="input"
          type="text"
          value={asText(value)}
          maxLength={field.maxLength ?? 4000}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "textarea" ? (
        <textarea
          className="textarea"
          rows={3}
          value={asText(value)}
          maxLength={field.maxLength ?? 4000}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "select" ? (
        <select
          className="select"
          value={asText(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            Choose…
          </option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === "string-list" ? (
        <StringListInput
          value={asList(value)}
          onChange={onChange as (next: string[]) => void}
          max={field.maxItems ?? 20}
        />
      ) : field.type === "pills-multi" ? (
        <PillsMulti
          options={field.options ?? []}
          value={asList(value)}
          onChange={onChange as (next: string[]) => void}
        />
      ) : null}
      {field.helpText ? (
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
          {field.helpText}
        </div>
      ) : null}
    </div>
  );
}

export default function DirectionForm({
  schema,
  initialPayload,
  saving,
  error,
  approvalTermsLabel,
  onSubmit,
}: Props) {
  const [payload, setPayload] = useState<Record<string, unknown>>(() => {
    const seed: Record<string, unknown> = {};
    for (const f of schema.fields) {
      seed[f.key] = initialPayload[f.key] ?? (f.type === "string-list" || f.type === "pills-multi" ? [] : "");
    }
    return seed;
  });
  const [approved, setApproved] = useState(false);

  function setField(key: string, value: unknown) {
    setPayload((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void onSubmit({ payload, approvedDirectionTerms: approved });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 24 }}>
      {schema.fields.map((field) => (
        <FieldRow
          key={field.key}
          field={field}
          value={payload[field.key]}
          onChange={(next) => setField(field.key, next)}
        />
      ))}

      <label
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 12,
          padding: 14,
          border: "1px solid var(--rule)",
          borderRadius: 12,
          background: "var(--paper-2)",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={approved}
          onChange={(e) => setApproved(e.target.checked)}
          style={{ marginTop: 4 }}
        />
        <div style={{ fontSize: 13, color: "var(--fg)", lineHeight: 1.6 }}>
          {approvalTermsLabel ??
            "I approve this direction. CrecyStudio will use this input to scope the project. Major changes after approval may affect the timeline or require a change order."}
        </div>
      </label>

      {error ? (
        <div
          style={{
            padding: 12,
            border: "1px solid var(--accent)",
            background: "var(--accent-bg)",
            color: "var(--accent-2)",
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      ) : null}

      <div>
        <button
          type="submit"
          className="btn btnPrimary"
          disabled={saving || !approved}
          style={{ padding: "12px 22px", fontSize: 14 }}
        >
          {saving ? "Submitting..." : "Submit direction"}
          <span className="btnArrow"> →</span>
        </button>
      </div>
    </form>
  );
}
