import type { GhostAnswer } from "@/lib/ghost/types";

export default function GhostAnswerPanel({ answer }: { answer: GhostAnswer | null }) {
  if (!answer) return null;

  return (
    <div className="card" style={{ marginTop: 10 }}>
      <div className="cardInner" style={{ display: "grid", gap: 8 }}>
        <div><strong>Direct answer:</strong> <span className="pDark">{answer.directAnswer}</span></div>
        <div><strong>Context:</strong> <span className="pDark">{answer.context}</span></div>
        <div><strong>Next action:</strong> <span className="pDark">{answer.nextAction}</span></div>
        <div><strong>Caution / risk:</strong> <span className="pDark">{answer.cautionRisk}</span></div>
      </div>
    </div>
  );
}
