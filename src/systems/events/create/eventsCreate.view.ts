// =====================================
// 📁 src/systems/events/create/eventsCreate.action.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";

// ----------------------------
// REGISTER MAIN CREATE BUTTON
// ----------------------------
export function registerEventsCreateActions() {
  registerUIAction("events.create.start", {
    system: "events",
    handler: async () => {
      // -------------------------------
      // WIDOK CREATE EVENT (bez importów)
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

      const standardRow = {
        type: 1,
        components: STANDARD_EVENT_TYPES.map((t) => ({
          type: 2,
          label: t.label,
          style: 1, // primary
          custom_id: `events.create.selectType|target=${t.value}`,
        })),
      };

      const otherRow = {
        type: 1,
        components: OTHER_EVENT_TYPES.map((t) => ({
          type: 2,
          label: t.label,
          style: 1, // primary
          custom_id: `events.create.selectType|target=${t.value}`,
        })),
      };

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

      // -------------------------------
      // Zwracamy obiekt widoku zamiast używać interaction.update()
      // -------------------------------
      return {
        content: "📌 **Create Event**\n\nSelect an event type:",
        components: [standardRow, otherRow, backRow],
      };
    },
  });
}