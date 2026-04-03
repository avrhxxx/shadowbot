// =====================================
// 📁 src/systems/events/create/eventsCreate.view.ts
// =====================================

import type { View } from "@/shared/types";

// -------------------------------
// MAPA EVENTÓW ZE SKRÓTAMI (custom_id)
// -------------------------------
const STANDARD_EVENT_TYPES = [
  { label: "Arcadian Conquest", value: "AC" },
  { label: "City Contest", value: "CC" },
  { label: "Reservoir Raid", value: "RR" },
  { label: "Ghoulion Pursuit", value: "GP" },
  { label: "KvK", value: "KVK" },
];

const OTHER_EVENT_TYPES = [
  { label: "Birthday", value: "BD" },
  { label: "Custom", value: "C" },
];

export async function eventsCreateView(): Promise<View> {
  // -------------------------------
  // FIRST ROW
  // -------------------------------
  const standardRow = {
    type: 1,
    components: STANDARD_EVENT_TYPES.map((t) => ({
      type: 2,
      label: t.label,
      style: 1,
      custom_id: `events.create.selectType|target=${t.value}`,
    })),
  };

  // -------------------------------
  // SECOND ROW
  // -------------------------------
  const otherRow = {
    type: 1,
    components: OTHER_EVENT_TYPES.map((t) => ({
      type: 2,
      label: t.label,
      style: 1,
      custom_id: `events.create.selectType|target=${t.value}`,
    })),
  };

  // -------------------------------
  // THIRD ROW (BACK)
  // -------------------------------
  const backRow = {
    type: 1,
    components: [
      {
        type: 2,
        label: "⬅ Back",
        style: 2,
        custom_id: "events.main.back",
      },
    ],
  };

  // ✅ TYLKO RETURN — ZERO interaction
  return {
    content: "📌 **Create Event**\n\nSelect an event type:",
    components: [standardRow, otherRow, backRow],
  };
}