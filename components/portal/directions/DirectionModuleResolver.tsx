"use client";

// Switches between Phase 2A's rich website DesignDirectionCard and
// Phase 3.3's generic DirectionCard for the other 4 lanes. The portal
// bundle exposes whichever direction record applies to the project type.

import DesignDirectionCard from "@/components/portal/DesignDirectionCard";
import DirectionCard from "./DirectionCard";
import type {
  WebsiteDesignDirection,
  WebsiteDesignDirectionInput,
} from "@/lib/designDirection";
import type { GenericDirection, GenericDirectionInput } from "@/lib/directions/types";

type Props = {
  // Resolved by the portal bundle: at most one of these is non-null.
  designDirection?: WebsiteDesignDirection | null;
  direction?: GenericDirection | null;
  onSubmitDesignDirection: (input: WebsiteDesignDirectionInput) => Promise<void>;
  onSubmitDirection: (input: GenericDirectionInput) => Promise<void>;
  // Optional draft auto-save for the website lane. Generic-direction
  // lanes don't have an auto-save flow yet.
  onSaveDesignDirectionDraft?: (input: WebsiteDesignDirectionInput) => Promise<void>;
};

export default function DirectionModuleResolver({
  designDirection,
  direction,
  onSubmitDesignDirection,
  onSubmitDirection,
  onSaveDesignDirectionDraft,
}: Props) {
  if (designDirection) {
    return (
      <DesignDirectionCard
        value={designDirection}
        onSubmit={onSubmitDesignDirection}
        onSaveDraft={onSaveDesignDirectionDraft}
      />
    );
  }
  if (direction) {
    return <DirectionCard value={direction} onSubmit={onSubmitDirection} />;
  }
  return null;
}
