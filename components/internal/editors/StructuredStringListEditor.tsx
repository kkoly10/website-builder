"use client";

export default function StructuredStringListEditor({
  label,
  note,
  items,
  onChange,
  emptyLabel = "No items yet.",
  addLabel = "Add item",
}: {
  label: string;
  note?: string;
  items: string[];
  onChange: (items: string[]) => void;
  emptyLabel?: string;
  addLabel?: string;
}) {
  function updateItem(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, idx) => idx !== index));
  }

  function addItem() {
    onChange([...items, ""]);
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <div className="fieldLabel">{label}</div>
        {note ? <div className="smallNote">{note}</div> : null}
      </div>

      {!items.length ? <div className="smallNote">{emptyLabel}</div> : null}

      {items.map((item, index) => (
        <div key={`${label}-${index}`} style={{ border: "1px solid var(--stroke)", background: "var(--panel2)", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <div style={{ fontWeight: 800, color: "var(--fg)", fontSize: 13 }}>Item {index + 1}</div>
            <button type="button" className="btn btnGhost" style={{ fontSize: 12 }} onClick={() => removeItem(index)}>
              Remove
            </button>
          </div>
          <textarea className="input" rows={3} value={item} onChange={(e) => updateItem(index, e.target.value)} style={{ width: "100%", resize: "vertical" }} />
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
