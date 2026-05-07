"use client";

import { useState } from "react";
import type {
  RequiredAction,
  RequiredActionOwner,
  RequiredActionStatus,
} from "@/lib/requiredActions";

type Props = {
  actions: RequiredAction[];
  busy: boolean;
  onCreate: (input: {
    actionKey: string;
    title: string;
    owner: RequiredActionOwner;
    description: string;
    dueDate: string;
  }) => Promise<void>;
  onPatch: (actionId: string, patch: Record<string, unknown>) => Promise<void>;
  onForceComplete: (actionId: string) => Promise<void>;
  onReopen: (actionId: string) => Promise<void>;
  onDelete: (actionId: string) => Promise<void>;
};

const OWNER_OPTIONS: RequiredActionOwner[] = ["client", "studio", "system"];
const STATUS_OPTIONS: RequiredActionStatus[] = [
  "not_started",
  "waiting_on_client",
  "submitted",
  "complete",
  "blocked",
];

function ownerBadge(owner: RequiredActionOwner): { bg: string; fg: string; label: string } {
  if (owner === "client") return { bg: "#fdf3e7", fg: "#a05a14", label: "Client" };
  if (owner === "studio") return { bg: "#eef4fb", fg: "#1f4f8a", label: "Studio" };
  return { bg: "#f1f1f1", fg: "#666", label: "System" };
}

function statusBadge(status: RequiredActionStatus): { bg: string; fg: string; label: string } {
  if (status === "complete") return { bg: "#e8f5e9", fg: "#256d31", label: "Complete" };
  if (status === "submitted") return { bg: "#fff8d9", fg: "#a5790f", label: "Submitted" };
  if (status === "blocked") return { bg: "#fde7e7", fg: "#a02525", label: "Blocked" };
  if (status === "waiting_on_client") return { bg: "#fdf3e7", fg: "#a05a14", label: "Waiting on client" };
  return { bg: "#f1f1f1", fg: "#666", label: "Not started" };
}

export default function RequiredActionsAdminPanel({
  actions,
  busy,
  onCreate,
  onPatch,
  onForceComplete,
  onReopen,
  onDelete,
}: Props) {
  const [draftActionKey, setDraftActionKey] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftOwner, setDraftOwner] = useState<RequiredActionOwner>("client");
  const [draftDueDate, setDraftDueDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const clientCount = actions.filter((a) => a.owner === "client" && a.status !== "complete").length;
  const studioCount = actions.filter((a) => a.owner === "studio" && a.status !== "complete").length;

  async function handleCreate() {
    const title = draftTitle.trim();
    const actionKey = draftActionKey.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (!title || !actionKey) return;
    await onCreate({
      actionKey,
      title,
      owner: draftOwner,
      description: draftDescription.trim(),
      dueDate: draftDueDate,
    });
    setDraftActionKey("");
    setDraftTitle("");
    setDraftDescription("");
    setDraftOwner("client");
    setDraftDueDate("");
  }

  return (
    <div style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: 14, padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--ink)", margin: 0 }}>Required actions</h3>
          <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 4 }}>
            Add ad-hoc actions, force-complete on the client&apos;s behalf, or unstick an owned action.
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted-2)", display: "flex", gap: 12 }}>
          <span>Client open: {clientCount}</span>
          <span>Studio open: {studioCount}</span>
        </div>
      </div>

      {/* List */}
      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {actions.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--muted-2)", padding: 14, border: "1px dashed var(--rule)", borderRadius: 10, textAlign: "center" }}>
            No required actions seeded for this portal yet.
          </div>
        ) : (
          actions.map((action) => {
            const ob = ownerBadge(action.owner);
            const sb = statusBadge(action.status);
            const isEditing = editingId === action.id;

            return (
              <div
                key={action.id}
                style={{
                  padding: "12px 14px",
                  border: "1px solid var(--rule)",
                  borderRadius: 10,
                  background: action.status === "complete" ? "var(--paper-2)" : "var(--paper)",
                  opacity: action.status === "complete" ? 0.7 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ background: ob.bg, color: ob.fg, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{ob.label}</span>
                      <span style={{ background: sb.bg, color: sb.fg, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{sb.label}</span>
                      <span style={{ fontSize: 11, color: "var(--muted-2)", fontFamily: "monospace" }}>{action.actionKey}</span>
                    </div>
                    {isEditing ? (
                      <input
                        className="input"
                        defaultValue={action.title}
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value !== action.title) {
                            void onPatch(action.id, { title: e.target.value.trim() });
                          }
                        }}
                        style={{ fontSize: 13, fontWeight: 500 }}
                      />
                    ) : (
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{action.title}</div>
                    )}
                    {action.description ? (
                      <div style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 4, lineHeight: 1.5 }}>{action.description}</div>
                    ) : null}
                    {action.dueDate ? (
                      <div style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 4 }}>
                        Due: {new Date(action.dueDate).toLocaleDateString()}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
                    <select
                      className="select"
                      value={action.status}
                      disabled={busy}
                      onChange={(e) => void onPatch(action.id, { status: e.target.value })}
                      style={{ fontSize: 12 }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{statusBadge(s).label}</option>
                      ))}
                    </select>
                    <select
                      className="select"
                      value={action.owner}
                      disabled={busy}
                      onChange={(e) => void onPatch(action.id, { owner: e.target.value })}
                      style={{ fontSize: 12 }}
                    >
                      {OWNER_OPTIONS.map((o) => (
                        <option key={o} value={o}>Owner: {ownerBadge(o).label}</option>
                      ))}
                    </select>
                    <div style={{ display: "flex", gap: 6 }}>
                      {action.status === "complete" ? (
                        <button
                          className="btn btnGhost"
                          disabled={busy}
                          onClick={() => void onReopen(action.id)}
                          style={{ fontSize: 11, padding: "6px 10px", flex: 1 }}
                        >
                          Reopen
                        </button>
                      ) : (
                        <button
                          className="btn btnPrimary"
                          disabled={busy}
                          onClick={() => void onForceComplete(action.id)}
                          style={{ fontSize: 11, padding: "6px 10px", flex: 1 }}
                          title="Mark complete on the client's behalf"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        className="btn btnGhost"
                        disabled={busy}
                        onClick={() => setEditingId(isEditing ? null : action.id)}
                        style={{ fontSize: 11, padding: "6px 10px" }}
                      >
                        {isEditing ? "Done" : "Edit"}
                      </button>
                      <button
                        className="btn btnGhost"
                        disabled={busy}
                        onClick={() => void onDelete(action.id)}
                        style={{ fontSize: 11, padding: "6px 10px", color: "var(--accent)" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New action form */}
      <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Add ad-hoc action
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
          <input
            className="input"
            placeholder="Title (e.g. Confirm domain transfer)"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            disabled={busy}
            style={{ fontSize: 12 }}
          />
          <input
            className="input"
            placeholder="Action key (auto from title)"
            value={draftActionKey}
            onChange={(e) => setDraftActionKey(e.target.value)}
            disabled={busy}
            style={{ fontSize: 12, fontFamily: "monospace" }}
          />
          <select
            className="select"
            value={draftOwner}
            onChange={(e) => setDraftOwner(e.target.value as RequiredActionOwner)}
            disabled={busy}
            style={{ fontSize: 12 }}
          >
            {OWNER_OPTIONS.map((o) => (
              <option key={o} value={o}>Owner: {ownerBadge(o).label}</option>
            ))}
          </select>
          <input
            className="input"
            type="date"
            value={draftDueDate}
            onChange={(e) => setDraftDueDate(e.target.value)}
            disabled={busy}
            style={{ fontSize: 12 }}
          />
        </div>
        <textarea
          className="textarea"
          rows={2}
          placeholder="Description (optional, shown to the client if owner is 'client')"
          value={draftDescription}
          onChange={(e) => setDraftDescription(e.target.value)}
          disabled={busy}
          style={{ fontSize: 12, marginBottom: 10 }}
        />
        <button
          className="btn btnPrimary"
          disabled={busy || !draftTitle.trim()}
          onClick={() => void handleCreate()}
          style={{ fontSize: 12, padding: "8px 16px" }}
        >
          Add action →
        </button>
      </div>
    </div>
  );
}
