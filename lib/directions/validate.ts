// Generic direction payload validation. Lane-agnostic: drives off the
// per-lane schema in lib/directions/schemas.ts.

import type { DirectionType } from "@/lib/workflows/types";
import type { GenericDirectionValidationResult } from "./types";
import { getDirectionSchema, type FieldDef } from "./schemas";

function asString(value: unknown, max = 4000): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function asStringArray(value: unknown, max = 20): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function validateField(
  field: FieldDef,
  raw: unknown,
): { ok: true; value: unknown } | { ok: false; error: string } {
  switch (field.type) {
    case "text":
    case "textarea": {
      const value = asString(raw, field.maxLength ?? 4000);
      if (field.required && !value) {
        return { ok: false, error: `${field.label} is required.` };
      }
      return { ok: true, value };
    }
    case "select": {
      const value = asString(raw, 500);
      if (field.required && !value) {
        return { ok: false, error: `${field.label} is required.` };
      }
      if (value && field.options && !field.options.includes(value)) {
        return { ok: false, error: `${field.label}: invalid choice.` };
      }
      return { ok: true, value };
    }
    case "string-list": {
      const list = asStringArray(raw, field.maxItems ?? 20);
      if (field.required && list.length === 0) {
        return { ok: false, error: `${field.label}: add at least one entry.` };
      }
      return { ok: true, value: list };
    }
    case "pills-multi": {
      const list = asStringArray(raw, field.maxItems ?? 20);
      if (field.required && list.length === 0) {
        return { ok: false, error: `${field.label}: pick at least one option.` };
      }
      if (field.options) {
        const allowed = new Set(field.options);
        for (const v of list) {
          if (!allowed.has(v)) {
            return { ok: false, error: `${field.label}: "${v}" is not a valid option.` };
          }
        }
      }
      return { ok: true, value: list };
    }
  }
}

// Validates a client-submitted direction payload against the schema for
// the lane. Returns a non-discriminated result (same pattern as Phase 2A's
// validateDesignDirectionInput) to dodge Next 16 narrowing quirks.
export function validateDirectionPayload(
  directionType: DirectionType,
  raw: unknown,
): GenericDirectionValidationResult {
  const schema = getDirectionSchema(directionType);
  if (!schema) {
    return {
      ok: false,
      value: null,
      error: `No direction schema available for ${directionType}.`,
    };
  }

  if (!raw || typeof raw !== "object") {
    return { ok: false, value: null, error: "Direction payload is required." };
  }
  const r = raw as Record<string, unknown>;

  if (r.approvedDirectionTerms !== true) {
    return {
      ok: false,
      value: null,
      error: "Please approve the direction terms before submitting.",
    };
  }

  const payload: Record<string, unknown> = {};
  const rawPayload =
    r.payload && typeof r.payload === "object"
      ? (r.payload as Record<string, unknown>)
      : {};

  for (const field of schema.fields) {
    const result = validateField(field, rawPayload[field.key]);
    if (!result.ok) {
      return { ok: false, value: null, error: result.error };
    }
    payload[field.key] = result.value;
  }

  return {
    ok: true,
    error: null,
    value: {
      payload,
      approvedDirectionTerms: true,
    },
  };
}
