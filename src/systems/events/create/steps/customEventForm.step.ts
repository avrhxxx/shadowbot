// =====================================
// 📁 src/systems/events/create/steps/customEventForm.step.ts
// =====================================

import { registerUIAction } from "@/ui/core/uiRouter";
import { formatEventUTC } from "@/shared/utils/timeUtils";

// =====================================
// 🧠 MODAL / VIEW
// =====================================
export function customEventFormView() {
  return {
    title: "📝 Custom Event",
    fields: [
      { type: "text", name: "name", label: "Event Name", placeholder: "Enter event name", required: true },
      { type: "number", name: "day", label: "Day", min: 1, max: 31, required: true },
      { type: "number", name: "month", label: "Month", min: 1, max: 12, required: true },
      { type: "number", name: "hours", label: "Hours", min: 0, max: 23, required: true },
      { type: "number", name: "minutes", label: "Minutes", min: 0, max: 59, required: true },
    ],
    cancelAction: "events.create.backToMain",
  };
}

// =====================================
// 🚀 REGISTER STEP
// =====================================
export function registerCustomEventFormStep() {
  // 🔹 Otwarcie formularza Custom Event
  registerUIAction("events.create.customEventForm", {
    system: "events",
    handler: async (ctx, _unused, payload) => {
      await ctx.showModal?.(customEventFormView(), payload);
    },
  });

  // 🔹 Submit formularza Custom Event
  registerUIAction("events.create.customForm.submit", {
    system: "events",
    handler: async (ctx, payload) => {
      const name = payload?.name ?? "Unnamed Event";
      const day = Number(payload?.day ?? 1);
      const month = Number(payload?.month ?? 1);
      const hours = Number(payload?.hours ?? 12);
      const minutes = Number(payload?.minutes ?? 0);

      const formatted = formatEventUTC(day, month, hours, minutes);

      // 🔹 Widok końcowy w stylu UI Engine
      const view = {
        content: `📝 Event: **${name}**\n📅 Date: **${formatted}**`,
        buttons: [
          { label: "⬅ Back", action: "events.create.backToMain", style: "secondary" },
        ],
      };

      // 🔹 Renderujemy z unikalnym viewId
      await ctx.renderView("events.create.customEvent.result", view);
    },
  });
}