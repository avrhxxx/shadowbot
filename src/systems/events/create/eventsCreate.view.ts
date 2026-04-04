// =====================================
// 📁 src/systems/events/create/eventsCreate.view.ts
// =====================================

import type { TraceContext } from "@/trace";
import type { ViewResult } from "@/core/ui/uiEngine";

export function eventsCreateView(): (ctx: TraceContext, state?: any) => ViewResult {
  return (ctx: TraceContext, state?: any) => {
    const STANDARD_EVENT_TYPES = [
      { label: "Arcadian Conquest", value: "AC" },
      { label: "City Contest", value: "CC" },
      { label: "Reservoir Raid", value: "RR" },
      { label: "Ghoulion Pursuit", value: "GP" },
      { label: "KvK", value: "KVK" },
    ] as const;

    const OTHER_EVENT_TYPES = [
      { label: "Birthday", value: "BD" },
      { label: "Custom", value: "C" },
    ] as const;

    const mapToButton = (t: { label: string; value: string }) => ({
      label: t.label,
      action: "events.create.selectType",
      state: { target: t.value },
      style: "primary" as const,
    });

    return {
      content: "📌 **Create Event**\n\nSelect an event type:",
      buttons: [
        ...STANDARD_EVENT_TYPES.map(mapToButton),
        ...OTHER_EVENT_TYPES.map(mapToButton),
      ],
    } as const;
  };
}