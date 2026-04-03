// =====================================
// 📁 src/systems/events/create/eventsCreate.view.ts
// =====================================

import type { View } from "@/shared/types";

const STANDARD_EVENT_TYPES = [
  { label: "Arcadian Conquest", value: "arcadian_conquest" },
  { label: "City Contest", value: "city_contest" },
  { label: "Reservoir Raid", value: "reservoir_raid" },
  { label: "Ghoulion Pursuit", value: "ghoulion_pursuit" },
  { label: "KvK", value: "kvk" }
];

export async function eventsCreateView(): Promise<View> {
  return {
    content: "📌 **Create Event**\n\nSelect a standard event type:",

    components: [
      {
        type: 1,
        components: STANDARD_EVENT_TYPES.map((t) => ({
          type: 2,
          label: t.label,
          style: 1,
          custom_id: `events.create.selectType|target=${t.value}`
        })),
      },
    ],
  };
}