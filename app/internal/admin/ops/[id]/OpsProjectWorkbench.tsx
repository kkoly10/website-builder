"use client";

import { useState } from "react";
import type { EnrichedOpsWorkspaceBundle } from "@/lib/opsWorkspace/state";
import OpsStageChecklistPanel from "./OpsStageChecklistPanel";
import OpsProjectControlClient from "./OpsProjectControlClient";

export default function OpsProjectWorkbench({
  initialData,
}: {
  initialData: EnrichedOpsWorkspaceBundle;
}) {
  const [bundle, setBundle] = useState(initialData);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleUpdated(next: EnrichedOpsWorkspaceBundle) {
    setBundle(next);
    setRefreshKey((value) => value + 1);
  }

  return (
    <div>
      <OpsStageChecklistPanel initialData={bundle} onUpdated={handleUpdated} />
      <OpsProjectControlClient key={refreshKey} initialData={bundle} />
    </div>
  );
}
