import type { GhostProjectSnapshot } from "@/lib/ghost/types";

export function GhostProjectSnapshotCard({ snapshot }: { snapshot: GhostProjectSnapshot }) {
  return (
    <div className="card"><div className="cardInner">
      <div style={{ fontWeight: 800 }}>Project Snapshot</div>
      <div className="pDark">Phase: <strong>{snapshot.phase}</strong></div>
      <div className="pDark">Status: <strong>{snapshot.status}</strong></div>
      <div className="pDark">Health: <strong>{snapshot.healthState}</strong></div>
    </div></div>
  );
}

export function GhostWaitingOnCard({ waitingOn }: { waitingOn: string }) {
  return <div className="card"><div className="cardInner"><div style={{ fontWeight: 800 }}>Waiting On</div><div className="pDark">{waitingOn}</div></div></div>;
}

export function GhostNextActionCard({ nextAction }: { nextAction: string }) {
  return <div className="card"><div className="cardInner"><div style={{ fontWeight: 800 }}>Next Action</div><div className="pDark">{nextAction}</div></div></div>;
}

export function GhostRiskFlagsCard({ riskFlags }: { riskFlags: string[] }) {
  return (
    <div className="card"><div className="cardInner"><div style={{ fontWeight: 800 }}>Risk Flags</div>
      {riskFlags.length ? <ul className="pDark" style={{ margin: "8px 0 0", paddingLeft: 18 }}>{riskFlags.map((r) => <li key={r}>{r}</li>)}</ul> : <div className="pDark">No active risk flags.</div>}
    </div></div>
  );
}

export function GhostSuggestedActionsCard({ snapshot }: { snapshot: GhostProjectSnapshot }) {
  return (
    <div className="card"><div className="cardInner"><div style={{ fontWeight: 800 }}>Suggested Actions</div>
      <ul className="pDark" style={{ margin: "8px 0 0", paddingLeft: 18 }}>
        <li>Confirm owner for: {snapshot.nextActionTitle}</li>
        <li>Post client-safe update with only published facts.</li>
        <li>Re-check risks before sending timeline promises.</li>
      </ul>
    </div></div>
  );
}
