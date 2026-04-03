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

const OTHER_EVENT_TYPES = [
  { label: "Birthday", value: "birthdays" },
  { label: "Custom", value: "custom" }
];

export async function eventsCreateView(): Promise<View> {
  // -------------------------------
  // FIRST ROW: standard event types (max 5)
  // -------------------------------
  const standardRow = {
    type: 1,
    components: STANDARD_EVENT_TYPES.map((t) => ({
      type: 2,
      label: t.label,
      style: 1, // primary
      custom_id: `events.create.selectType|target=${t.value}`,
    })),
  };

  // -------------------------------
  // SECOND ROW: other event types (Birthday, Custom)
  // -------------------------------
  const otherRow = {
    type: 1,
    components: OTHER_EVENT_TYPES.map((t) => ({
      type: 2,
      label: t.label,
      style: 1, // primary
      custom_id: `events.create.selectType|target=${t.value}`,
    })),
  };

  // -------------------------------
  // THIRD ROW: Back button
  // -------------------------------
  const backRow = {
    type: 1,
    components: [
      {
        type: 2,
        label: "⬅ Back",
        style: 2, // secondary
        custom_id: "events.main.back",
      },
    ],
  };

  return {
    content: "📌 **Create Event**\n\nSelect an event type:",
    components: [standardRow, otherRow, backRow],
  };
}