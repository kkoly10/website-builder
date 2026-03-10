import Link from "next/link";
import GhostMessageThreadSidebar from "@/components/internal/ghost/GhostMessageThreadSidebar";

export const dynamic = "force-dynamic";

export default function GhostMessagesPage() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="card">
        <div className="cardInner">
          <div className="kicker">
            <span className="kickerDot" /> Ghost Admin v1.1
          </div>
          <h1 className="h2">Message Analysis Lab (Internal Only)</h1>
          <p className="pDark">
            Use this to analyze client thread snippets with optional lane, project, and thread
            context. Ghost now grounds replies in real project state when you provide a linked lane
            and project ID. Nothing is auto-sent.
          </p>
          <div style={{ marginTop: 10 }}>
            <Link href="/internal" className="btn btnGhost">
              ← Back to HQ
            </Link>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <GhostMessageThreadSidebar />
      </div>
    </section>
  );
}