"use client";

type FieldType = "text" | "textarea" | "select" | "stringList";

export type StructuredField = {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  rows?: number;
  placeholder?: string;
  helpText?: string;
};

function toLines(value: unknown) {
  return Array.isArray(value) ? value.join("\n") : "";
}

export default function StructuredObjectListEditor<T extends Record<string, any>>({
  label,
  note,
  items,
  onChange,
  createItem,
  fields,
  emptyLabel = "No items added yet.",
  addLabel = "Add item",
  getItemTitle,
}: {
  label: string;
  note?: string;
  items: T[];
  onChange: (items: T[]) => void;
  createItem: () => T;
  fields: StructuredField[];
  emptyLabel?: string;
  addLabel?: string;
  getItemTitle?: (item: T, index: number) => string;
}) {
  function updateItem(index: number, patch: Partial<T>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, idx) => idx !== index));
  }

  function addItem() {
    onChange([...items, createItem()]);
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <div className="fieldLabel">{label}</div>
        {note ? <div className="smallNote">{note}</div> : null}
      </div>

      {!items.length ? <div className="smallNote">{emptyLabel}</div> : null}

      {items.map((item, index) => (
        <div key={`${label}-${index}`} style={{ border: "1px solid var(--stroke)", background: "var(--panel2)", borderRadius: 12, padding: 14, display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <div style={{ fontWeight: 800, color: "var(--fg)" }}>
              {getItemTitle ? getItemTitle(item, index) : `${label} ${index + 1}`}
            </div>
            <button type="button" className="btn btnGhost" style={{ fontSize: 12 }} onClick={() => removeItem(index)}>
              Remove
            </button>
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {fields.map((field) => {
              const value = item[field.key];
              const type = field.type || "text";
              return (
                <div key={field.key}>
                  <div className="fieldLabel">{field.label}</div>
                  {field.helpText ? <div className="smallNote">{field.helpText}</div> : null}
                  {type === "select" ? (
                    <select className="select" value={String(value ?? "")} onChange={(e) => updateItem(index, { [field.key]: e.target.value } as Partial<T>)}>
                      {(field.options || []).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : type === "textarea" ? (
                    <textarea className="input" rows={field.rows || 4} value={String(value ?? "")} onChange={(e) => updateItem(index, { [field.key]: e.target.value } as Partial<T>)} style={{ width: "100%", resize: "vertical" }} placeholder={field.placeholder} />
                  ) : type === "stringList" ? (
                    <textarea className="input" rows={field.rows || 5} value={toLines(value)} onChange={(e) => updateItem(index, { [field.key]: e.target.value.split(/\n+/).map((entry) => entry.trim()).filter(Boolean) } as Partial<T>)} style={{ width: "100%", resize: "vertical" }} placeholder={field.placeholder || "One item per line"} />
                  ) : (
                    <input className="input" value={String(value ?? "")} onChange={(e) => updateItem(index, { [field.key]: e.target.value } as Partial<T>)} placeholder={field.placeholder} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div>
        <button type="button" className="btn btnGhost" onClick={addItem}>
          {addLabel}
        </button>
      </div>
    </div>
  );
}
